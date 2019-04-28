// Enable chromereload by uncommenting this line:
import 'chromereload/devonly';
import * as $ from 'jquery';
import * as moment from 'moment';
import * as toastr from 'toastr';
import * as jconfirm from 'jquery-confirm';

const CALENDAR_BUTTON_ID_PREFIX = 'nico2-google-calendar';


/*
 * -----------------------------------------
 *   Google Calendar追加ボタンを表示
 * ----------------------------------------- */
chrome.storage.sync.get('buttonSize', (value) => {
    let buttonSize;
    if (value.buttonSize !== undefined) {
        buttonSize = value.buttonSize;
    } else {
        buttonSize = 'medium';
    }

    $('#bn_gbox .blbox_wrap .hmf')
        .append('<button id="' + CALENDAR_BUTTON_ID_PREFIX + '-' + buttonSize + '">Google Calendarに追加</button>');
});

let errorHandler = (message: string = 'エラーが発生しました') => {
    $('button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']')
        .addClass('nico2-google-calendar-error')
        .prop('disabled', true);

        toastr.options.closeButton = true;
        toastr.options.positionClass = 'toast-top-right';
        toastr.options.showDuration = 300;
        toastr.options.hideDuration = 5000;
        toastr.options.timeOut = 5000;
        toastr.options.extendedTimeOut = 2000;
        toastr.options.showEasing = 'swing';
        toastr.options.hideEasing = 'linear';
        toastr.options.showMethod = 'fadeIn';
        toastr.options.hideMethod = 'fadeOut';

        const manifest = chrome.runtime.getManifest();
        toastr.error(message, 'nico2 google calendar');
};

let displayGuide = () => {
    const guideHTML = `
    <dialog id="nico2-google-guide" open>
        nico2 google calendarをご利用頂き、ありがとうございます。<br />
        <br />
        <h1>初回登録時のみ認証が必要です</h1>
        クリックすると認証画面が開きますので、許可してください。<br />
        <div id="nico2-google-guide-add-block">
            <button id="nico2-google-guide-add-button">Google Calendarに追加<br />（認証画面が開きます）</button>
        </div>
        <h1>登録するカレンダーを変更できます</h1>
        <p>
            オプションページから設定してください。
        </p>
        <button id="nico2-google-guide-option-button">オプションを開く</button>
    </dialog>`;

    // $.alert({
    //     title: '',
    //     content: guideHTML
    // });
};
// displayGuide();

/**
 * 番組の情報を取得する
 */
let getProgramInfo = (): { title: string, start: Date } => {
    let programTitle = $('#gate .gate_title .program-title').text();
    let dateStartStr = $('#bn_gbox .hmf .kaijo').text().trim();
    // 番組開始日時を取得する正規表現
    const dateStartRegexp = /([0-9]{4}\/[0-9]{2}\/[0-9]{2})\([月火水木金土日]\).*開演:([0-9]{2}):([0-9]{2})/;
    let match;

    match = dateStartRegexp.exec(dateStartStr);

    let startDatetime;
    if (match !== null) {
        // 開始日時を取得
        let date = match[1];
        let startHour = parseInt(match[2]);
        let startMinute = parseInt(match[3]);

        if (startHour < 24) {
            let startTime = startHour + ':' + startMinute;
            startDatetime = new Date(date + ' ' + startTime);
        } else {
            startHour = startHour - 24;
            let startTime = startHour + ':' + startMinute;
            startDatetime = moment(new Date(date + ' ' + startTime)).add(1, 'days').toDate();
        }
    }

    if (startDatetime === undefined) {
        errorHandler();
        throw new Error();
    }

    return {
        title: programTitle,
        start: startDatetime
    };
};

/**
 * 番組がすでにカレンダーに追加済か確認する
 */
let getScheduleProgramDate = (): void => {
    console.log('Background にスケジュール取得を依頼');

    const programInfo = getProgramInfo();

    chrome.runtime.sendMessage({
        action: 'getSchedule',
        title: programInfo.title,
        dateTime: JSON.stringify(new Date(programInfo.start))    // Dateオブジェクトはそのまま送信できない
    }, (response) => {
        // BackGroundでは非同期で処理するため、CallbackはaddListenerで対応
    });
};
getScheduleProgramDate();

$('#bn_gbox .blbox_wrap .hmf')
    .on('click', 'button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']', function () {
        const programInfo = getProgramInfo();

        // Backgroundスクリプト宛にGoogle Calendarへ追加するよう送信
        chrome.runtime.sendMessage({
            action: 'addCalendar',
            title: programInfo.title,
            start: JSON.stringify(programInfo.start),    // Dateオブジェクトはそのまま送信できない
            url: location.href
        }, (response) => {
            // BackGroundでは非同期で処理するため、CallbackはaddListenerで対応
        });
    });

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        switch (request.action) {
            case 'addCalendarResponse':
                console.log('backgroundからの返却値：', request);

                if ('isError' in request) {
                    if (!request.isError) {
                        $('button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']').text('Google Calendar 追加済').prop('disabled', true);
                    } else {
                        let reason: string = '';
                        if (request.reason = 'USER_DENIED') {
                            reason = '許可して頂く必要があります';
                            setTimeout(() => {
                                $('button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']')
                                    .text('Google Calendarに追加')
                                    .removeClass('nico2-google-calendar-error')
                                    .prop('disabled', false);
                            }, 1000 * 5);
                        }
                        errorHandler(reason);
                    }
                }
                break;

            case 'getScheduleResponse':
                console.log('スケジュールチェック結果：', request);
                if ('isRegistered' in request) {
                    if (request.isRegistered) {
                        $('button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']').text('Google Calendar 追加済').prop('disabled', true);
                    }
                }
                break;

            case 'changeButtonSize':
                console.log('ボタンサイズ反映(', request.buttonSize + ')');
                $('button[id^=' + CALENDAR_BUTTON_ID_PREFIX + ']')
                    .attr('id', CALENDAR_BUTTON_ID_PREFIX + '-' + request.buttonSize);
            break;

            default:
                console.warn('対応外のメッセージ', request);
                break;
        }
    }
);

/* ------------------------------------------------------
 * 機能紹介
 ------------------------------------------------------ */
function notifyFeature() {
    const message: {[key: string]: string} = {
        '0.3.0': '予定を追加するカレンダーを選べるようになりました。詳しくは<a id="open-option-page" style="text-decoration: underline;">設定ページ</a>をご覧ください。',
        '0.4.0': 'ボタンのサイズを選べるようになりました。詳しくは<a id="open-option-page" style="text-decoration: underline;">設定ページ</a>をご覧ください。',
        '0.4.2': 'ニコニコ生放送のHTTPS化に対応しました。'
    };

    toastr.options.closeButton = true;
    toastr.options.positionClass = 'toast-bottom-right';
    toastr.options.showDuration = 300;
    toastr.options.hideDuration = 5000;
    toastr.options.timeOut = 5000;
    toastr.options.extendedTimeOut = 2000;
    toastr.options.showEasing = 'swing';
    toastr.options.hideEasing = 'linear';
    toastr.options.showMethod = 'fadeIn';
    toastr.options.hideMethod = 'fadeOut';

    const manifest = chrome.runtime.getManifest();
    if (message[manifest.version] !== undefined) {
        toastr.info(message[manifest.version], 'nico2 google calendar');
    }

    // 拡張機能のオプションを開く設定
    const openOptionLink = document.getElementById('open-option-page');
    if (openOptionLink !== null) {
        openOptionLink.addEventListener('click', () => {
            chrome.runtime.sendMessage({action: 'openOptionPage'}, function(response) {
            });
        });
    }
}


chrome.storage.sync.get('isFirstShow', (result) => {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;

    if (result !== undefined) {
        if (!('isFirstShow' in result) || result['isFirstShow'][currentVersion] === true) {
            notifyFeature();

            // 機能紹介を表示済であることを記録
            chrome.storage.sync.set({isFirstShow: {[currentVersion]: false}}, () => {});
        }
    }
});