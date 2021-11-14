/**
 * Utilities
 */

import { EnvironmentMissingError } from "../helpers/Errors";
import { default as axios } from "axios";

export function getEnv(
  key: string,
  abortIfFail: boolean = true
): string | undefined {
  const value = process.env[key];

  if (value) {
    return value;
  } else {
    if (abortIfFail)
      throw new EnvironmentMissingError(`Environment ${key} is undefined`);
    else return undefined;
  }
}

export async function getImageBuffer(imageUrl: string): Promise<Buffer> {
  const res = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  return Buffer.from(res.data, "base64");
}
