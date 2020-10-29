import {Codec} from 'io-ts/Codec'
import { Decoder } from "io-ts/Decoder";
import { Encoder } from "io-ts/Encoder";

export type Route = {
  input: Decoder<any, any>
  output: Encoder<any, any>
}

export type Routes = Record<string, Route>

export const api = <R extends Routes>(routes: R) => routes