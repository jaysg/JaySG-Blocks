import {
  queryUserInfo,
  queryCompanyInfo,
  queryUpdateAvatar,
  updatePwdData,
  sendCodeInfo,
  bindingEmailOrMobile,
  updateUserInfo,
} from './service';
import { getSessionInfo } from './utils/utils';
import { message } from 'antd';
import { formatMessage } from 'umi-plugin-react/locale';
import { AnyAction, Reducer } from 'redux';
import { EffectsCommandMap } from 'dva';

export interface StateType {
  visible: Boolean;
  currentUser: any;
  userInfo: any;
  companyInfo: any;
}

export type Effect = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: StateType) => T) => T },
) => void;

export interface ModelType {
  namespace: string;
  state: StateType;
  effects: {
    fetch: Effect;
    updateAvatar: Effect;
    updatePassword: Effect;
    sendCode: Effect;
    bindingEmailOrMobile: Effect;
    updateUserInfo: Effect;
  };
  reducers: {
    updateToView: Reducer<StateType>;
  };
}

const Model: ModelType = {
  namespace: 'BLOCK_NAME_CAMEL_CASE',

  state: {
    currentUser: {},
    visible: false,
    userInfo: {},
    companyInfo: {},
  },

  effects: {
    *fetch({ callback }, { call, put }) {
      const infoRes = yield call(queryUserInfo);
      const companyRes = yield call(queryCompanyInfo);
      //保存用户信息到localStorage
      if (infoRes && companyRes) {
        if (infoRes.data && infoRes.code == 0) {
          localStorage.setItem('currentUser', JSON.stringify(infoRes.data));
          localStorage.setItem('userRole', infoRes.data.roleName);
          localStorage.setItem('companyInfo', JSON.stringify(companyRes.data));
          yield put({
            type: 'updateToView',
            payload: {
              currentUser: infoRes.data,
              roleName: infoRes.data.roleName,
              companyInfo: companyRes.data,
            },
          });
          if (callback) callback();
        } else {
          window.location.href = window.location.origin + '/user/login';
        }
      }
    },
    *updateAvatar({ payload }, { call, put }) {
      const res = yield call(queryUpdateAvatar, payload);
      if (res) {
        if (res.code == 0) {
          let currentUser = getSessionInfo('currentUser');
          if (res.data) {
            currentUser.headIcon = res.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            yield put({
              type: 'updateToView',
              payload: { currentUser },
            });
          }
          message.success(formatMessage({ id: 'app.update_success' }));
        } else message.error(`${formatMessage({ id: 'app.update_error' })}--${res.message}`);
      }
    },
    *updatePassword({ payload, callback }, { call }) {
      const res = yield call(updatePwdData, payload);
      if (res) {
        if (res.code == 0) {
          message.success(`${formatMessage({ id: 'app.update_success' })}:请重新登录!`);
          if (callback) callback();
        } else message.error(`${formatMessage({ id: 'app.update_error' })}--${res.message}`);
      }
    },
    *sendCode({ payload, callback }, { call }) {
      const res = yield call(sendCodeInfo, payload);
      if (res) {
        if (res.code == 0) {
          if (callback) callback(res);
          message.success(formatMessage({ id: 'app.message.sendercode' }));
        } else message.error(res.message);
      }
    },
    *bindingEmailOrMobile({ payload, callback }, { call, put }) {
      const res = yield call(bindingEmailOrMobile, payload);
      if (res) {
        if (res.code == 0) {
          let currentUser = getSessionInfo('currentUser');
          currentUser[payload.media] = payload.account;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          if (callback) callback();
          yield put({
            type: 'updateToView',
            payload: { isBinding: true, currentUser },
          });
          message.success(formatMessage({ id: 'app.message.bindsuccess' }));
        } else message.error(res.message);
      }
    },
    *updateUserInfo({ payload, callback }, { call, put }) {
      const res = yield call(updateUserInfo, payload);
      if (res) {
        if (res.code == 0) {
          if (res.data) {
            localStorage.setItem('currentUser', JSON.stringify(res.data));
            yield put({
              type: 'updateToView',
              payload: { currentUser: res.data },
            });
          }
          if (callback) callback();
          message.success(formatMessage({ id: 'app.update_success' }));
        } else message.error(`${formatMessage({ id: 'app.update_error' })}--${res.message}`);
      }
    },
  },
  reducers: {
    updateToView(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};

export default Model;
