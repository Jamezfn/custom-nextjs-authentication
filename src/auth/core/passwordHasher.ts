import crypto from 'crypto';

type Props = {
    password: string;
    salt: string;
    hashedPassword: string;
};

export function genSalt() {
    return crypto.randomBytes(16).toString("hex").normalize();
}

export function hashPassword(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password.normalize(), salt, 64, (error, hash) => {
            if (error) reject();

            resolve(hash.toString("hex").normalize());
        });
    });
}

export async function comparePwd({ password, salt, hashedPassword }: Props) {
    const inputHashedPwd = await hashPassword(password, salt);

    return crypto.timingSafeEqual(
        Buffer.from(inputHashedPwd, "hex"),
        Buffer.from(hashedPassword, "hex")
    );
}