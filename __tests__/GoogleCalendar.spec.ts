import { GoogleCalendar } from '../app/scripts/GoogleCalendar';
import axios, { AxiosInstance } from 'axios';

describe('スケジュール追加', () => {
    xit('test1-1', () => {
        const myAxios: jest.Mocked<AxiosInstance> = axios as any;
        myAxios.post.mockResolvedValue({ data: { message: 'Mock response!!!' } });

        // const api = new GoogleCalendar('dummy token', axios);
        // const response = api.addSchedule('タイトル', new Date(), new Date(), '説明', 'id');
        // expect(response).toBe('OK');
    });
});