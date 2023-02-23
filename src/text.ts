type TEXTS_T = typeof DEFAULT_TEXTS;
export type TEXTS_KEY = keyof typeof DEFAULT_TEXTS;

export class Texts {
  _data: TEXTS_T;

  constructor(lang?: string | null) {
    this._data = getTexts(lang);
  }
  getRaw(key: TEXTS_KEY): string {
    return this._data[key] || "";
  }
  get(key: TEXTS_KEY): string {
    return escapeText(this._data[key] || "");
  }
  getAttr(key: TEXTS_KEY): string {
    return escapeText(this._data[key] || "");
  }
}

export const escapeText = (s: string) => {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

export function getTexts(lang?: string | null): TEXTS_T {
  if (!lang) {
    lang = window.navigator.language;
  }
  const ar = lang.split(/[-_]/);
  lang = ar[0];
  const res = TEXTS[lang];
  if (res) {
    return res;
  }

  return TEXTS.default;
}

const DEFAULT_TEXTS = {
  "Change Avatar": "Change Avatar",
  "Mic Off": "Disable Mic",
  "Mic On": "Enable Mic",
  "Open voice volume control": "Open voice volume control",
  "Close voice volume control": "Close voice volume control",
  "Open bgm volume control": "Open bgm volume control",
  "Close bgm volume control": "Close bgm volume control",
  "Show Mirror": "Show Mirror",
  "Hide Mirror": "Hide Mirror",
  RPMhint: "Easy (3 minutes)",
  VRMhint: "For those who know",
  "Choose File": "Choose File",
  "Downloading...": "Downloading...",
  "Setting...": "Setting...",
  AvatarSetError: "Failed to load avatar file",
  AvatarDownloadError: "Download failed",
};

export const TEXTS: { [key: string]: TEXTS_T } = {
  default: DEFAULT_TEXTS,
  ja: {
    "Change Avatar": "アバターを変更する",
    "Mic Off": "マイクを無効にする",
    "Mic On": "マイクを有効にする",
    "Open voice volume control": "ボイスの音量コントロールを開く",
    "Close voice volume control": "ボイスの音量コントロールを閉じる",
    "Open bgm volume control": "BGMの音量コントロールを開く",
    "Close bgm volume control": "BGMの音量コントロールを閉じる",
    "Show Mirror": "鏡を表示する",
    "Hide Mirror": "鏡を消す",
    RPMhint: "簡単 (所要時間3分)",
    VRMhint: "詳しい人向け",
    "Choose File": "ファイルを選択",
    "Downloading...": "ダウンロード中...",
    "Setting...": "設定中...",
    AvatarSetError: "アバターファイルの読み込みに失敗しました",
    AvatarDownloadError: "ダウンロードに失敗しました",
  },
  zh: {
    "Change Avatar": "改变你的头像",
    "Mic Off": "禁用麦克风",
    "Mic On": "启用麦克风",
    "Open voice volume control": "开放式语音音量控制",
    "Close voice volume control": "关闭语音音量控制",
    "Open bgm volume control": "打开BGM音量控制",
    "Close bgm volume control": "关闭BGM音量控制",
    "Show Mirror": "显示镜子",
    "Hide Mirror": "隐藏镜子",
    RPMhint: "简单（所需时间：3分钟）",
    VRMhint: "对于那些知道",
    "Choose File": "选择文件",
    "Downloading...": "下载中...",
    "Setting...": "设置...",
    AvatarSetError: "载入头像文件失败",
    AvatarDownloadError: "下载失败",
  },
};
