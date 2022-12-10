import { APIError, fetchApiJson, fetchApiText, streamLogs } from ".";

export type SupportedPlatforms =
  | "ESP8266"
  | "ESP32"
  | "ESP32S2"
  | "ESP32S3"
  | "ESP32C3"
  | "RP2040";

export interface CreateConfigParams {
  name: string;
  ssid: string;
  psk: string;
  board: string;
  platform: SupportedPlatforms;
}

export interface Configuration {
  storage_version: number;
  name: string;
  comment: string | null;
  esphome_version: string;
  src_version: number;
  arduino_version: string;
  address: string;
  esp_platform: SupportedPlatforms;
  board: string;
  build_path: string;
  firmware_bin_path: string;
  loaded_integrations: string[];
}

export type Manifest = { path: string; offset: number }[];

export const createConfiguration = (params: CreateConfigParams) =>
  fetchApiText("./wizard", {
    method: "post",
    body: JSON.stringify(params),
  });

export const getConfiguration = (configuration: string) =>
  fetchApiJson<Configuration>(`./info?configuration=${configuration}`);

export const deleteConfiguration = (configuration: string) =>
  fetchApiText(`./delete?configuration=${configuration}`, {
    method: "post",
  });

export const compileConfiguration = (
  configuration: string,
  abortController?: AbortController
) => streamLogs("compile", { configuration }, undefined, abortController);

export const getConfigurationManifest = (configuration: string) =>
  fetchApiJson<Manifest>(`./manifest.json?configuration=${configuration}`);

export const getDownloadUrl = (
  configuration: string,
  factoryFirmware: boolean
) => {
  let url = `./download.bin?configuration=${encodeURIComponent(configuration)}`;
  if (factoryFirmware) {
    url += "&type=firmware-factory.bin";
  }
  return url;
};

// null if file not found.
export const getJsonConfig = async (
  filename: string
): Promise<Record<string, any> | null> => {
  try {
    return fetchApiJson(`./json-config?configuration=${filename}`);
  } catch (err) {
    if (err instanceof APIError && err.status === 404) {
      return null;
    }
    throw err;
  }
};

export const getConfigurationApiKey = async (
  configuration: string
): Promise<string | undefined> => {
  const config = await getJsonConfig(configuration);
  return config?.api?.encryption?.key;
};
