import axios, { AxiosAdapter } from 'axios';
import * as moment from 'moment';
import { Nico2 } from './Nico2';

export class GoogleCalendar {
    private token: string;
    private axios: AxiosAdapter;

    public constructor(token: string, axios: AxiosAdapter) {
        this.token = token;
        this.axios = axios;
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
        const res = await this.axios({
            url: 'https://www.googleapis.com/calendar/v3/calendars/' + calendarID + '/events',
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + this.getToken(),
                'Content-Type': 'application/json'      // これがないと400エラーになる
            },
            data: {
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
            }
        });

        console.log(res.status);
    }

    public async getScheduleByDate(date: Date, calendarID: string) {
        let dateMoment = moment(date);
        const res = await this.axios({
            url: 'https://www.googleapis.com/calendar/v3/calendars/' + calendarID + '/events',
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + this.getToken(),
                'Content-Type': 'application/json'      // これがないと400エラーになる
            },
            params: {
                timeMin: dateMoment.format('YYYY-MM-DD') + 'T00:00:00+09:00',
                timeMax: dateMoment.format('YYYY-MM-DD') + 'T23:59:59+09:00'
            }
        });

        console.log(res.data);

        return res.data.items;
    }

    public async getCalendarList() {
        const res = await this.axios({
            url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + this.getToken(),
                'Content-Type': 'application/json'      // これがないと400エラーになる
            }
        });

        return res.data.items;
    }
}