/**
 * Data input/output interface common to Gui2D and Gui3D.
*
* @example Mock
* ```js
      function createMockGuiHandlers() {
        let isMicOn = false;
        let bgmVolume = 0;
        let voiceVolume = 0;
        let isMirrorOn = false;
        const listeners = [];
        const onModified = () => listeners.forEach((f) => f());
        return {
          addModifiedListener: (f) => {
            listeners.push(f);
          },
          isMicOn: () => isMicOn,
          micOff: async () => {
            isMicOn = false;
            onModified();
          },
          micOn: async () => {
            isMicOn = true;
            onModified();
          },
          getBgmVolume: () => bgmVolume,
          setBgmVolume: async (v) => (bgmVolume = v),
          getVoiceVolume: () => voiceVolume,
          setVoiceVolume: async (v) => (voiceVolume = v),
          isMirrorOn: () => isMirrorOn,
          mirrorOff: async () => {
            isMirrorOn = false;
            onModified();
          },
          mirrorOn: async () => {
            isMirrorOn = true;
            onModified();
          },
          setAvatarURL: async (url, fileData) => {
            console.log(`Avatar URL:`, url, fileData);
          },
          setAvatarData: async (fileData) => {
            console.log(`Avatar Data:`, fileData);
          },
        };
      }
      const mockGuiHandlers = createMockGuiHandlers();
      gui2d.setGuiHandlers(mockGuiHandlers);
      mockGuiHandlers.addModifiedListener(() => gui2d.updateStates());
      gui3d.setGuiHandlers(mockGuiHandlers);
      mockGuiHandlers.addModifiedListener(() => gui3d.updateStates());
 * ```
 */
export interface GuiHandlers {
  /**
   * Get microphone ON/OFF
   */
  isMicOn(): boolean;
  /**
   * Turn off the microphone
   */
  micOff(): Promise<void>;
  /**
   * Turn on the microphone
   */
  micOn(): Promise<void>;
  /**
   * Get the volume of BGM
   */
  getBgmVolume(): number; // 0 <= volume <= 1
  /**
   * Set the volume of BGM
   */
  setBgmVolume(volume: number): Promise<void>;
  /**
   * Get the volume of voice chat
   */
  getVoiceVolume(): number; // 0 <= volume <= 1
  /**
   * Set the volume of voice chat
   */
  setVoiceVolume(volume: number): Promise<void>;

  /**
   * Get the display state of the mirror
   */
  isMirrorOn(): boolean;
  /**
   * Hide mirror
   */
  mirrorOff(): Promise<void>;
  /**
   * Show mirror
   */
  mirrorOn(): Promise<void>;
  /**
   * Change avatar
   * @remarks
   * Use an avatar URL on the Web
   * @param url - Avatar URL on the Web that can be retrieved from a browser
   * @param fileData - Downloaded avatar data
   */
  setAvatarURL(url: string, fileData: ArrayBuffer): Promise<void>;
  /**
   * Change avatar
   * @remarks
   * Use avatar data from local files, etc.
   * @param fileData - avatar data
   */
  setAvatarData(fileData: ArrayBuffer): Promise<void>;
}
