import { requestRedict } from './utils/request';

export async function queryUserInfo(payload: any) {
  return requestRedict('/api/v2/secure/customer/me');
}

export async function queryCompanyInfo(payload: any) {
  return requestRedict('/api/v2/secure/customer/company');
}

/**
 * @description 修改用户头像
 */
export async function queryUpdateAvatar(payload: any) {
  const avatarData = new FormData();
  avatarData.append('image', payload);
  return requestRedict('/api/v2/secure/customer/me/avatar', avatarData, 'PUT');
}

/**
 * @description 修改用户密码
 */
export async function updatePwdData(payload: any) {
  const { data } = payload;
  return requestRedict('/api/v2/secure/customer/me/modify/password', data, 'POST');
}

/**
 * @description 获取验证码
 */
export async function sendCodeInfo(payload: any) {
  const { media, account } = payload;
  return requestRedict(`/api/v2/secure/customer/send/${media}/verification`, { account }, 'POST');
}

/**
 * @description 修改绑定邮箱或手机号
 */
export async function bindingEmailOrMobile(payload: any) {
  const { media, account, code } = payload;
  return requestRedict(
    `/api/v2/secure/customer/verify/${media}/verification/${code}/purpose/bind`,
    { account },
    'POST',
  );
}

/**
 * @description 用户信息修改
 */
export async function updateUserInfo(payload: any) {
  return requestRedict('/api/v2/secure/customer/me', payload, 'PUT');
}
