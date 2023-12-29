export const maskPhone = (inputPhone) => {
  const cleanedPhone = inputPhone.replace(/\D+/g, '');
  const isShortNumber = cleanedPhone.length < 11;

  const ph = isShortNumber
    ? cleanedPhone.match(/(\d{0,2})(\d{0,4})(\d{0,4})/)
    : cleanedPhone.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);

  return !ph[2] ? ph[1] : `(${ph[1]}) ${ph[2]}` + (ph[3] ? `-${ph[3]}` : '');
};

export const maskPersonalRegister = (inputCpf) => {
  const dc = inputCpf
            .replace(/\D+/g, '')
            .match(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/);
  return inputCpf = `${dc[1]}` + (dc[2] ? `.${dc[2]}` : ``) + (dc[3] ? `.${dc[3]}` : ``) + (dc[4] ? `-${dc[4]}` : ``);
};

export const maskZipCode = (inputZcode) => {
  
  const zc = inputZcode
            .replace(/\D+/g, '')
            .match(/(\d{0,5})(\d{0,3})/)

  return inputZcode = `${zc[1]}` + (zc[2] ? `-${zc[2]}` : ``);
};


export const maskCepFormat = (inputCep) => {
  const cep = caractNumeric(inputCep.value);
  let adjustedValue = "";

  const part0 = cep.slice(0, 5);
  const part1 = cep.slice(5, 8);

  adjustedValue = `${part0}-${part1}`;

  inputCep.value = cep.length >= 8 ? adjustedValue : cep;
};

export const controlMask = (elementIn, method) => {
  const inputElement = elementIn;
  const execMethod = method;
  setTimeout(() => execMask(inputElement, execMethod), 1);
};

export const execMask = (elementInDelay, methodDelay) => {
  elementInDelay.value = methodDelay(elementInDelay.value);
};

export const caractNumeric = (value) => value.replace(/\D/g, "");

export const caractUppCase = (value) => value.toUpperCase();

export const caractLowCase = (value) => value.toLowerCase();

export const caractAlphaAcent = (value) =>
  value.replace(/[^AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzÃãÂâÁáÊêÉéÍíÕõÔôÓóÚúÇç .]/g, "");