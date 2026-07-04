import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";
import { sessionEventEmitter } from "./eventEmitters";
import { debounceHandler } from "./debounceHandler";
import { ApiMethods } from "../../types/service";

/** Site origin only — service paths already include `/api/...`. */
function normalizeApiBaseUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/\/api\/?$/, "") || url;
}

const apiUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export interface ClientRequestConfig<Req> {
  path: string;
  method: ApiMethods;
  baseUrl?: string;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
  data?: Req;
  options?: {
    isDownload?: boolean;
    isFormData?: boolean;
  };
}

interface ClientInstanceConfig {
  baseUrl?: string;
}

export class Client {
  http: AxiosInstance | null = null;

  constructor(config?: ClientInstanceConfig) {
    this.create(config);
  }

  async request<Req = unknown, Resp = unknown>(
    config: ClientRequestConfig<Req>
  ): Promise<Resp> {
    if (!this.http) {
      throw new Error("Client not initialized.");
    }

    const payloadFormat: Record<ApiMethods, "params" | "data"> = {
      [ApiMethods.GET]: "params",
      [ApiMethods.POST]: "data",
      [ApiMethods.PUT]: "data",
      [ApiMethods.PATCH]: "data",
      [ApiMethods.DELETE]: "data",
    };

    const defaultHeaders: Record<string, string> = {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    };

    if (config.options?.isFormData) {
      delete defaultHeaders["Content-Type"];
    }

    return this.http
      .request({
        url: config.path,
        method: config.method,
        headers: { ...defaultHeaders, ...config.headers },
        baseURL: config.baseUrl || apiUrl,
        responseType: config.options?.isDownload ? "blob" : "json",
        [payloadFormat[config.method]]: config.data,
      })
      .then(({ data }) => data as Resp)
      .catch((err) => {
        if (err.response?.status === 401) {
          debounceHandler(() => {
            sessionEventEmitter.emit("unauthorized", {});
          }, 300);
        }
        return Promise.reject(err.response?.data ?? err);
      });
  }

  create(config?: ClientInstanceConfig) {
    this.http = axios.create({
      baseURL: config?.baseUrl || apiUrl,
    });

    this.http.interceptors.request.use((requestConfig) => {
      const token =
        typeof window !== "undefined" ? Cookies.get("accessToken") : null;

      if (token) {
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      return requestConfig;
    });
  }
}

const client = new Client();
export default client;
