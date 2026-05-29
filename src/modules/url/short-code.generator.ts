import { randomBytes } from "node:crypto";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---------------------------------------
// Short code generator
// ---------------------------------------
export function generateShortCode(length = 8) {
    const bytes = randomBytes(length);

    let code = "";

    for (let index = 0; index < length; index += 1) {
        const byte = bytes[index]!;

        code += alphabet[byte % alphabet.length];
    }

    return code;
}
