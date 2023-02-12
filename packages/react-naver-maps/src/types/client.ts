
export type NcpOptions = {
  submodules?: string[];
  /**
   * ncpClientId, govClientId, finClientId 중 선택
   */
  ncpClientId: string;
};

export type GovOptions = {
  submodules?: string[];
  /**
   * ncpClientId, govClientId, finClientId 중 선택
   */
  govClientId: string;
};

export type finOptions = {
  submodules?: string[];
  /**
   * ncpClientId, govClientId, finClientId 중 선택
   */
  finClientId: string;
};

export type ClientOptions = NcpOptions | GovOptions | finOptions;
