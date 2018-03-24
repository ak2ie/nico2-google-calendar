import axios from 'axios';
import * as moment from 'moment';

export class GoogleCalendar {
    private token: string;

    public constructor(token: string) {
        this.token = token;
    }

    private getToken(): string {
        return this.token;
    }

    public async addSchedule(title: string, start: Date, end: Date, url: string) {
        let startMoment = moment(start);
        let endMoment = moment(end);
        const res = await axios({
            url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
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

    public async getScheduleByDate(date: Date) {
        let dateMoment = moment(date);
        const res = await axios({
            url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
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
}