import bcrypt from "bcrypt"

async function hash(input:string) {
    return await bcrypt.hash(input + String(process.env.SALT_PASSWORD), 10);
}

export default hash;