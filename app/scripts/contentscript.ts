// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';
import * as $ from "jquery";
import * as moment from "moment";
import * as toastr from "toastr";
import * as Swal from "sweetalert2";
const CALENDAR_BUTTON_ID_PREFIX = "nico2-google-calendar";

/*
 * -----------------------------------------
 *   Google Calendar追加ボタンを表示
 * ----------------------------------------- */
/**
 * Google Calendar追加ボタンを表示する
 * @param buttonSize ボタンサイズ（large, small)
 */
const DisplayButton = (buttonSize: string, isRegistered: boolean) => {
  $("#" + CALENDAR_BUTTON_ID_PREFIX + "-box").hide();
  switch (buttonSize) {
    case "large":
      $(".___watch-navigation-area___1RwlE").append('<div id="' +
        CALENDAR_BUTTON_ID_PREFIX +
        '-box"><button id="' +
        CALENDAR_BUTTON_ID_PREFIX +
        "-" +
        buttonSize +
        '">Google Calendarに追加</button></div>'
      );

      if (isRegistered) {
        $(`button#${CALENDAR_BUTTON_ID_PREFIX}`)
          .text("Google Calendarに追加済")
          .prop("disabled", true);
      }

      break;

    case "small":
      $(".___menu-dock___3_ass")
        .children("li")
        .last()
        // .children("li:first")
        .before(function () {
          return (
            '<li><div id="' +
            CALENDAR_BUTTON_ID_PREFIX +
            '-box"><button id="' +
            CALENDAR_BUTTON_ID_PREFIX +
            "-" +
            buttonSize +
            '" class="unregistered">Google Calendarに追加</button></div></li>'
          );
        });

      if (isRegistered) {
        $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]").attr(
          "class",
          "registered"
        );
      }
      break;

    default:
      console.error("ボタンサイズが想定外", buttonSize);
      break;
  }
};

chrome.storage.sync.get("buttonSize", (value) => {
  let buttonSize = "small";
  if (value.buttonSize !== undefined) {
    buttonSize = value.buttonSize;
  } else {
    buttonSize = "large";
  }
  DisplayButton(buttonSize, false);
});

let errorHandler = (message: string = "エラーが発生しました") => {
  $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]")
    .addClass("nico2-google-calendar-error")
    .prop("disabled", true);

  toastr.options.closeButton = true;
  toastr.options.positionClass = "toast-top-right";
  toastr.options.showDuration = 300;
  toastr.options.hideDuration = 5000;
  toastr.options.timeOut = 5000;
  toastr.options.extendedTimeOut = 2000;
  toastr.options.showEasing = "swing";
  toastr.options.hideEasing = "linear";
  toastr.options.showMethod = "fadeIn";
  toastr.options.hideMethod = "fadeOut";

  const manifest = chrome.runtime.getManifest();
  toastr.error(message, "nico2 google calendar");
};

$("body").on("click", "#nico2-google-guide-add-button", function () {
  const programInfo = getProgramInfo();

  // 未認証の場合
  chrome.runtime.sendMessage(
    {
      action: "addCalendar",
      title: programInfo.title,
      start: JSON.stringify(programInfo.start), // Dateオブジェクトはそのまま送信できない
      url: location.href,
      option: "beforeAuth",
    },
    (response) => {
      // BackGroundでは非同期で処理するため、CallbackはaddListenerで対応
    }
  );
});

let displayGuide = () => {
  const guideHTML = `<div id="nico2-google-guide">
        nico2 google calendarをご利用頂き、<br />ありがとうございます。<br />
        <br />
        <b>初回登録時のみ認証が必要です</b><br />
        <span style="font-size: 0.8em">クリックすると認証画面が開きますので、許可してください。</span><br />
        <div id="nico2-google-guide-add-block">
            <button id="nico2-google-guide-add-button">Google Calendarに追加<br />（認証画面が開きます）</button>
        </div>
        </div>`;

  Swal.default.fire({
    html: guideHTML,
    type: "info",
    showConfirmButton: false,
  });
};

/**
 * 番組の情報を取得する
 */
let getProgramInfo = (): { title: string; start: Date } => {
  let programTitle = $(".___title___2vJQN span").text();
  let dateStartStr = $(".___onair-time___xWLfr").text().trim();
  // 番組開始日時を取得する正規表現
  const dateStartRegexp = /([0-9]{4}\/[0-9]{2}\/[0-9]{2})\([月火水木金土日]\).*([0-9]{2}):([0-9]{2})開始/;
  let match;

  match = dateStartRegexp.exec(dateStartStr);

  let startDatetime;
  if (match !== null) {
    // 開始日時を取得
    let date = match[1];
    let startHour = parseInt(match[2]);
    let startMinute = parseInt(match[3]);

    if (startHour < 24) {
      let startTime = startHour + ":" + startMinute;
      startDatetime = new Date(date + " " + startTime);
    } else {
      startHour = startHour - 24;
      let startTime = startHour + ":" + startMinute;
      startDatetime = moment(new Date(date + " " + startTime))
        .add(1, "days")
        .toDate();
    }
  }

  if (startDatetime === undefined) {
    errorHandler();
    throw new Error();
  }

  return {
    title: programTitle,
    start: startDatetime,
  };
};

/**
 * 番組がすでにカレンダーに追加済か確認する
 */
let getScheduleProgramDate = (): void => {
  console.log("Background にスケジュール取得を依頼");

  const programInfo = getProgramInfo();

  chrome.runtime.sendMessage(
    {
      action: "getSchedule",
      title: programInfo.title,
      dateTime: JSON.stringify(new Date(programInfo.start)), // Dateオブジェクトはそのまま送信できない
    },
    (response) => {
      // BackGroundでは非同期で処理するため、CallbackはaddListenerで対応
    }
  );
};
getScheduleProgramDate();

$("body").on(
  "click",
  "button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]",
  function () {
    const programInfo = getProgramInfo();

    // Backgroundスクリプト宛にGoogle Calendarへ追加するよう送信
    chrome.runtime.sendMessage(
      {
        action: "addCalendar",
        title: programInfo.title,
        start: JSON.stringify(programInfo.start), // Dateオブジェクトはそのまま送信できない
        url: location.href,
      },
      (response) => {
        // BackGroundでは非同期で処理するため、CallbackはaddListenerで対応
      }
    );
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "addCalendarResponse":
      console.log("backgroundからの返却値：", request);
      Swal.default.close();

      if ("isError" in request) {
        if (!request.isError) {
          chrome.storage.sync.get("buttonSize", (value) => {
            let buttonSize = "small";
            if (value.buttonSize !== undefined) {
              buttonSize = value.buttonSize;
            } else {
              buttonSize = "medium";
            }

            if (buttonSize === "small") {
              $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]").attr(
                "class",
                "registered"
              );
            } else {
              $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]")
                .text("Google Calendar 追加済")
                .prop("disabled", true);
            }
          });
        } else if (request.reason === "NOT_AUTHORIZED") {
          displayGuide();
        } else {
          let reason: string = "";
          if ((request.reason = "USER_DENIED")) {
            reason = "許可して頂く必要があります";
            setTimeout(() => {
              $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]")
                .text("Google Calendarに追加")
                .removeClass("nico2-google-calendar-error")
                .prop("disabled", false);
            }, 1000 * 5);
          }
          errorHandler(reason);
        }
      }
      break;

    case "getScheduleResponse":
      console.log("スケジュールチェック結果：", request);
      if ("isRegistered" in request) {
        if (request.isRegistered) {
          if ($(`button#${CALENDAR_BUTTON_ID_PREFIX}-large`).length) {
            $(`button#${CALENDAR_BUTTON_ID_PREFIX}-large`)
              .text("Google Calendar 追加済")
              .prop("disabled", true);
          } else if ($(`button#${CALENDAR_BUTTON_ID_PREFIX}-small`).length) {
            $(`button#${CALENDAR_BUTTON_ID_PREFIX}-small`)
              .attr(
                "class",
                "registered"
              );
          }
        }
      }
      break;

    case "changeButtonSize":
      console.log("ボタンサイズ反映(", request.buttonSize + ")");
      const isRegistered =
        $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]").attr("disabled") ===
        "disabled";
      DisplayButton(request.buttonSize, request.buttonSize);
      if (isRegistered) {
        $("button[id^=" + CALENDAR_BUTTON_ID_PREFIX + "]")
          .text("Google Calendar 追加済")
          .prop("disabled", true);
      }
      break;

    default:
      console.warn("対応外のメッセージ", request);
      break;
  }
});

/* ------------------------------------------------------
 * 機能紹介
 ------------------------------------------------------ */
function notifyFeature() {
  const message: { [key: string]: string } = {
    "0.3.0":
      '予定を追加するカレンダーを選べるようになりました。詳しくは<a id="open-option-page" style="text-decoration: underline;">設定ページ</a>をご覧ください。',
    "0.4.0":
      'ボタンのサイズを選べるようになりました。詳しくは<a id="open-option-page" style="text-decoration: underline;">設定ページ</a>をご覧ください。',
    "0.4.2": "ニコニコ生放送のHTTPS化に対応しました。",
    "0.4.3": "視聴ページのデザイン変更に暫定対応しました。",
    "0.5.0": "視聴ページのデザイン変更に完全対応しました。"
  };

  toastr.options.closeButton = true;
  toastr.options.positionClass = "toast-bottom-right";
  toastr.options.showDuration = 300;
  toastr.options.hideDuration = 5000;
  toastr.options.timeOut = 5000;
  toastr.options.extendedTimeOut = 2000;
  toastr.options.showEasing = "swing";
  toastr.options.hideEasing = "linear";
  toastr.options.showMethod = "fadeIn";
  toastr.options.hideMethod = "fadeOut";

  const manifest = chrome.runtime.getManifest();
  if (message[manifest.version] !== undefined) {
    toastr.info(message[manifest.version], "nico2 google calendar");
  }

  // 拡張機能のオプションを開く設定
  const openOptionLink = document.getElementById("open-option-page");
  if (openOptionLink !== null) {
    openOptionLink.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openOptionPage" }, function (
        response
      ) { });
    });
  }
}

chrome.storage.sync.get("isFirstShow", (result) => {
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  if (result !== undefined) {
    if (
      !("isFirstShow" in result) ||
      result["isFirstShow"][currentVersion] === true
    ) {
      notifyFeature();

      // 機能紹介を表示済であることを記録
      chrome.storage.sync.set(
        { isFirstShow: { [currentVersion]: false } },
        () => { }
      );
    }
  }
});

export function test() {
  $("#test").text("Hello2");
}
