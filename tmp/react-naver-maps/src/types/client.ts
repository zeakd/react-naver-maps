export type CommonOptions = {
  submodules?: string[];
  /**
   * ncpKeyId로 대체됨
   * */
  ncpKeyId: string;
};

/** @deprecated */
export type NcpOptions = {
  submodules?: string[];
  /**
   * @deprecated ncpKeyId로 대체
   * ncpClientId, govClientId, finClientId 중 선택
   */
  ncpClientId: string;
};

/** @deprecated */
export type GovOptions = {
  submodules?: string[];
  /**
   * @deprecated ncpKeyId로 대체
   * ncpClientId, govClientId, finClientId 중 선택
   */
  govClientId: string;
};

/** @deprecated */
export type finOptions = {
  submodules?: string[];
  /**
   * @deprecated ncpKeyId로 대체
   * ncpClientId, govClientId, finClientId 중 선택
   */
  finClientId: string;
};

export type ClientOptions = CommonOptions | NcpOptions | GovOptions | finOptions;
