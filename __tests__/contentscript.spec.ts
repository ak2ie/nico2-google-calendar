import * as contentscript from "../app/scripts/contentscript";
const $ = require("jquery");

describe("ボタン表示", () => {
  it("サイズ大", () => {
    document.body.innerHTML = '<div id="test">test</div>';
    contentscript.test();
    expect($("#test").text()).toEqual("Hello");
  });
});
