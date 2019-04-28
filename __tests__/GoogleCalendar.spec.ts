import { GoogleCalendar } from '../app/scripts/GoogleCalendar';
import axios from 'axios';
import { MockAdapter } from 'axios-mock-adapter';

describe('スケジュール追加', () => {
    it('test1-1', () => {
        const mock = new MockAdapter(axios);
        mock.onPost('').reply(200, 'OK');
        const api = new GoogleCalendar('dummy token', axios);
        const response = api.addSchedule('タイトル', new Date(), new Date(), '説明', 'id');
        expect(response).toBe('OK');
    });
});