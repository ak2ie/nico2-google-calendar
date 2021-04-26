import { AxiosAdapter } from 'axios';
import * as moment from 'moment';

export class GoogleCalendar {
    private token: string;

    public constructor(token: string) {
        this.token = token;
    }

    private getToken(): string {
        return this.token;
    }

    /**
     * Google Calendarに予定を追加する
     * @param title タイトル
     * @param start 開始時刻
     * @param end 終了時刻
     * @param url 説明
     * @param calendarID 予定を追加するカレンダー
     */
    public async addSchedule(title: string, start: Date, end: Date, url: string, calendarID: string) {
        let startMoment = moment(start);
        let endMoment = moment(end);

        const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarID}/events`,
            {
                method: "POST",
                headers: {
                    'Authorization': 'Bearer ' + this.getToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'summary': title,
                    'start': {
                        'dateTime': startMoment.format('YYYY-MM-DDTHH:mm:ss+09:00'),
                        'timeZone': 'Asia/Tokyo'
                    },
                    'end': {
                        'dateTime': endMoment.format('YYYY-MM-DDTHH:mm:ss+09:00'),
                        'timeZone': 'Asia/Tokyo'
                    },
                    description: url
                })
            }
        );

        console.log(res.status);
    }

    /**
     * 対象カレンダーID内の対象日付の予定を取得する
     * @param date 検索対象日付
     * @param calendarID 検索対象カレンダーID
     * @returns 予定
     */
    public async getScheduleByDate(date: Date, calendarID: string) {
        let dateMoment = moment(date);
        const params = {
            timeMin: dateMoment.format('YYYY-MM-DD') + 'T00:00:00+09:00',
            timeMax: dateMoment.format('YYYY-MM-DD') + 'T23:59:59+09:00'
        };
        const query = new URLSearchParams(params);

        const res = await (await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarID}/events?${query}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + this.getToken(),
                    'Content-Type': 'application/json'      // これがないと400エラーになる
                }
            }
        )).json();

        return res.items;
    }

    /**
     * カレンダー一覧を取得する
     * @returns カレンダー一覧
     */
    public async getCalendarList() {
        const res = await (await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
                method: 'get',
                headers: {
                    'Authorization': 'Bearer ' + this.getToken(),
                    'Content-Type': 'application/json'      // これがないと400エラーになる
                }
            }
        )).json();

        return res.items;
    }
}