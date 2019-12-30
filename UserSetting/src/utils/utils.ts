/**
 *
 * @param key sample:currentUser获取当前用户信息 | companyInfo获取当前公司信息 | deploymentType获取部署环境
 */
export function getSessionInfo(key: string) {
  let info = localStorage.getItem(key);
  if (info && info[0] == '{') {
    return JSON.parse(info);
  }
  return {};
}
