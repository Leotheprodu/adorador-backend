import * as bcrypt from 'bcrypt';

const saltRounds = 10;

const passwordEncrypt = async (passwordPlain: string) => {
  const hash = await bcrypt.hash(passwordPlain, saltRounds);
  return hash;
};

const passwordCompare = async (passwordPlain: string, hashPassword: string) =>
  bcrypt.compare(passwordPlain, hashPassword);

export { passwordCompare, passwordEncrypt };
