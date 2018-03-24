// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';
import * as $ from 'jquery';
import * as moment from 'moment';

const CALENDAR_BUTTON_ID = 'nico2-google-calendar';

// Google Calendar追加ボタンを表示
$('#bn_gbox .blbox_wrap .hmf')
    .append('<button id ="' + CALENDAR_BUTTON_ID + '">Google Calendarに追加</button>');

let errorHandler = (message: string = 'エラーが発生しました') => {
    $('#' + CALENDAR_BUTTON_ID)
        .text(message)
        .addClass('nico2-google-calendar-error')
        .prop('disabled', true);
};

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
    .on('click', '#' + CALENDAR_BUTTON_ID, function () {
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
                        $('#' + CALENDAR_BUTTON_ID).text('Google Calendar 追加済').prop('disabled', true);
                    } else {
                        let reason: string = '';
                        if (request.reason = 'USER_DENIED') {
                            reason = '許可して頂く必要があります';
                            setTimeout(() => {
                                $('#' + CALENDAR_BUTTON_ID)
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
                        $('#' + CALENDAR_BUTTON_ID).text('Google Calendar 追加済').prop('disabled', true);
                    }
                }
                break;

            default:
                console.warn('対応外のメッセージ', request);
                break;
        }
    }
);