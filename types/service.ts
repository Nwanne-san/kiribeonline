/* eslint-disable no-unused-vars */

import { ClientRequestConfig } from "@/utils/client";

export enum ApiMethods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
  PATCH = "patch",
}

export enum QueryType {
  query = "query",
  infiniteQuery = "infinite-query",
  mutation = "mutation",
}

declare global {
  interface ServiceInterface<Req extends object, Resp>
    extends Omit<ClientRequestConfig<Req>, "responseType"> {
    transform?: (req: Req, resp: Resp) => Resp;
  }

  interface ErrorResponse {
    message?: string;
    statusCode?: number;
    errors?: Record<string, string[]>;
  }
}
