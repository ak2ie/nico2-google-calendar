import axios from 'axios';

export class Nico2 {
    public async getProgramInfo(programId: string): Promise<ProgramInfo> {
        const programInfoData = await this.getProgramInfoFromAPI('lv311947467');
        let parser = new DOMParser();
        let doc = parser.parseFromString(programInfoData.data, 'text/xml');
        console.log(doc);

        return new ProgramInfo();
    }

    /**
     * ニコ生APIから番組データを取得する
     * @param programId 生放送ID（lvXXXXX)
     */
    private async getProgramInfoFromAPI(programId: string) {
        if (!programId.startsWith('lv')) {
            throw new Error('programId is not start with "lv"');
        }

        const res = await axios.get('http://watch.live.nicovideo.jp/api/getplayerstatus?v=' + programId);

        return res;
    }
}

export class ProgramInfo {
    public title: string;
    public gateOpenTime: Date;
    public startTime: Date;
    public endTime: Date;
}