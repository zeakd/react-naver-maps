
export type NcpOptions = {
  submodules?: string[];
  ncpClientId: string;
};

export type GovOptions = {
  submodules?: string[];
  govClientId: string;
};

export type finOptions = {
  submodules?: string[];
  finClientId: string;
};

export type ClientOptions = NcpOptions | GovOptions | finOptions;
