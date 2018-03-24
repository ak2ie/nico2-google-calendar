// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';
import { GoogleCalendar } from './GoogleCalendar';
import * as moment from 'moment';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion);
});

const ERR_MSG_USER_DENIED = 'The user did not approve access.';

/**
 * ContentScriptからのメッセージ処理
 */
chrome.runtime.onMessage.addListener(
  async function (request, sender) {
    switch (request.action) {
      case 'addCalendar':
        console.log('カレンダーに追加');
        chrome.identity.getAuthToken({ interactive: true }, async function (token) {
          if (chrome.runtime.lastError) {
            if (sender.tab !== undefined && sender.tab.id !== undefined) {
              let callbackMsg = {
                action: 'addCalendarResponse',
                isError: true,
                reason: ''
              };
              if (chrome.runtime.lastError.message === ERR_MSG_USER_DENIED) {
                callbackMsg['reason'] = 'USER_DENIED';
              }
              chrome.tabs.sendMessage(sender.tab.id, callbackMsg);
            }
            console.error(chrome.runtime.lastError.message);
            return;
          }

          const gcal = new GoogleCalendar(token);
          await gcal.addSchedule(request.title, JSON.parse(request.start), JSON.parse(request.start), request.url);

          if (sender.tab !== undefined && sender.tab.id !== undefined) {
            chrome.tabs.sendMessage(sender.tab.id, {
              action: 'addCalendarResponse',
              isError: false
            });
            console.log('response');
          }
        });

        break;

      case 'getSchedule':
        chrome.identity.getAuthToken({ interactive: false }, async function (token) {
          if (chrome.runtime.lastError) {
            if (sender.tab !== undefined && sender.tab.id !== undefined) {
              chrome.tabs.sendMessage(sender.tab.id, {
                action: 'getScheduleResponse',
                isError: true
              });
            }
            console.error(chrome.runtime.lastError.message);
            return;
          }
          const gcal = new GoogleCalendar(token);
          const scheduleList = await gcal.getScheduleByDate(JSON.parse(request.dateTime));
          let isRegistered = false;
          let startDateTime = moment(JSON.parse(request.dateTime));

          for (const schedule of scheduleList) {
            if (schedule.summary === request.title && schedule.start.dateTime === startDateTime.format('YYYY-MM-DDTHH:mm:ss+09:00')) {
              isRegistered = true;
              break;
            }
          }

          if (sender.tab !== undefined && sender.tab.id !== undefined) {
            chrome.tabs.sendMessage(sender.tab.id, {
              action: 'getScheduleResponse',
              isError: false,
              isRegistered: isRegistered
            });
            console.log('response');
          }
        });
        break;
      default:
        break;
    }
  }
);
