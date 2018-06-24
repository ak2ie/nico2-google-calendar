// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';

import { GoogleCalendar } from './GoogleCalendar';

/**
 * カレンダーリスト表示
 */
chrome.identity.getAuthToken({ interactive: false }, async function (token) {
    if (chrome.runtime.lastError) {
        // 権限取得に失敗した場合
        displayErrorMessage();
        // 明示的に権限を取得してカレンダーも取得するためのボタンを表示
        displayGetAuth();
    } else {
        // 権限を取得できた場合
        // カレンダーは取得できたので、取得ボタンは消す
        hideGetAuth();

        displayCalendars(token);
    }
});

const saveButton = document.getElementById('save');
if (saveButton !== null) {
    saveButton.addEventListener('click', () => {
        /**
         * 保存ボタン クリックハンドラー
         */
        const calendarList = document.getElementById('calendar-list');
        if (calendarList != null && calendarList.children != null) {
            for (let index = 0; index < calendarList.children.length; index++) {
                const selectedCalendar: HTMLInputElement = <HTMLInputElement>calendarList.children[index];

                if (selectedCalendar.checked === true) {
                    chrome.storage.sync.set({calendarID: selectedCalendar.value}, () => {
                        const statusBox = document.getElementById('status');
                        if (statusBox != null) {
                            statusBox.innerHTML = '保存しました';
                            setTimeout(() => {
                                statusBox.innerHTML = '';
                            }, 700);
                        }
                      });
                }
            }
        }
    });
}

/**
 * 権限取得ボタン クリックハンドラ
 */
const getAuthButton = <HTMLInputElement>document.getElementById('getCalendars');
if (getAuthButton !== null) {
    getAuthButton.addEventListener('click', () => {
        // 明示的に権限を取得
        chrome.identity.getAuthToken({ interactive: true }, async function (token) {
            if (chrome.runtime.lastError) {
                // 権限を取得できなかった場合はボタンを非表示・無効化して終了
                displayErrorMessage();
                disableAllButtons();
            } else {
                // 権限を取得できた場合

                // カレンダー取得ボタンを消す
                hideGetAuth();
                displayCalendars(token);
            }
        });
    });
}

/**
 * エラー発生時にメッセージ表示とボタン無効化
 */
let displayErrorMessage = (message = '') => {
    // エラーメッセージを表示
    const listbox = document.getElementById('calendar-list');
    if (listbox !== null) {
        listbox.innerHTML = 'カレンダーを取得できませんでした' + message;
    }

    // 保存ボタンを無効化
    const saveButton = <HTMLInputElement> document.getElementById('save');
    if (saveButton !== null) {
    saveButton.disabled = true;
    }
};

/**
 * カレンダーを表示する
 * @param token Google トークン
 */
let displayCalendars = async (token: string) => {
    const listbox = document.getElementById('calendar-list');
    if (listbox != null) {
        const googleCalendar = new GoogleCalendar(token);
        const list = await googleCalendar.getCalendarList();

        listbox.innerHTML = '';

        const calendarID = await getCalendarID();

        // カレンダー表示
        for (let index = 0; index < list.length; index++) {
            if (list[index].accessRole === 'owner' || list[index].accessRole === 'writer') {
                // 予定を追加できる場合
                let radioButtonChecked = '';
                if (list[index].id === calendarID) {
                    radioButtonChecked = 'checked';
                }

                listbox.innerHTML += '<input type="radio" name="calendar" value="' + list[index].id + '" id="' + list[index].id + '" ' + radioButtonChecked + ' class="selectableCalendars"><label for="' + list[index].id + '"> ' + list[index].summary + '</label><br />';
            } else {
                // 予定を追加できない場合
                listbox.innerHTML += '<input type="radio" name="calendar" value="' + list[index].id + '" disabled> ' + list[index].summary + '（権限がありません）<br />';
            }
        }

        addSaveButtonHandler();
    }
};

/**
 * カレンダー取得ボタンを表示
 */
let displayGetAuth = () => {
    const getAuthButton = <HTMLInputElement>document.getElementById('getCalendars');
    if (getAuthButton !== null) {
        getAuthButton.style.display = 'inline';
    }

    // 保存ボタンを無効化
    const saveButton = <HTMLInputElement> document.getElementById('save');
    if (saveButton !== null) {
        saveButton.disabled = true;
    }
};

/**
 * カレンダー取得ボタンを非表示
 */
let hideGetAuth = () => {
    const getAuthButton = <HTMLInputElement>document.getElementById('getCalendars');
    if (getAuthButton !== null) {
        getAuthButton.style.display = 'none';
    }
};

/**
 * カレンダー取得ボタンと保存ボタンを無効化
 */
let disableAllButtons = () => {
    // カレンダー取得ボタンを無効化
    const getAuthButton = <HTMLInputElement>document.getElementById('getCalendars');
    if (getAuthButton !== null) {
        getAuthButton.disabled = false;
    }

    // 保存ボタンを無効化
    const saveButton = <HTMLInputElement> document.getElementById('save');
    if (saveButton !== null) {
        saveButton.disabled = true;
    }
};

/**
 * chrome.storageからカレンダーIDを取得する
 * @return string カレンダーID
 */
const getCalendarID = (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      let calendarID = '';

      chrome.storage.sync.get('calendarID', async(value: string | any) => {
        if (value !== undefined) {
          calendarID = value.calendarID;
        } else {
          calendarID = 'primary';
        }

        resolve(calendarID);
      });
    });
  };

/**
 * 保存ボタン有効化状態変更
 */
const addSaveButtonHandler = () => {
    const calendars = document.getElementsByClassName('selectableCalendars');

    const saveButton = <HTMLInputElement> document.getElementById('save');
    if (saveButton !== null) {
        for (let i = 0; i < calendars.length; i++) {
            calendars[i].addEventListener('change', () => {
                saveButton.disabled = false;
            });
        }
    }
};