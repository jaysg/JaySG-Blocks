import React, { PureComponent } from 'react';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { formatMessage, FormattedMessage } from 'umi-plugin-react/locale';
import styles from './index.less';
import { getSessionInfo } from './utils/utils';
import { sum, padStart } from 'lodash';
import { Dispatch } from 'redux';
import { StateType } from './model';
import { FormComponentProps } from 'antd/es/form';
import { Row, Col, Input, Button, Icon, Avatar, Modal, Upload, message, Form, Select, Checkbox, } from 'antd';
import { connect } from 'dva';
import router from 'umi/router';
import { get } from 'lodash';
const FormItem = Form.Item;
const Option = Select.Option;
const mobileReg = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;

const validator_noSpace = (rule: any, value: any, callback: any) => {
  if (value) {
    if (value.length > 40) callback('输入超出限制');
  }
  callback();
}
interface UserFormProps {
  alertNotificationType: Array<number>;
  gender: string;
  job: string;
  jobNumber: string;
  name: string;
}
interface PAGE_NAME_UPPER_CAMEL_CASEProps extends FormComponentProps {
  dispatch: Dispatch<any>;
  BLOCK_NAME_CAMEL_CASE: StateType;
  submitting: boolean;
}
interface PAGE_NAME_UPPER_CAMEL_CASEState {
  chk: number;
  countDownE: number; //邮箱验证码倒计时
  countDownP: number; //手机验证码倒计时
  saveTel: string;
  saveEmail: string;
  visible: boolean;
  confirmLoading: boolean;
  currentFile: File | null;
  loading: boolean;
  imageUrl: null;
}
export interface UserRegisterParams {
  mail: string;
  password: string;
  confirm: string;
  mobile: string;
  captcha: string;
  prefix: string;
}

function getBase64(img: any, callback: any) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}
class PAGE_NAME_UPPER_CAMEL_CASE extends PureComponent<
  PAGE_NAME_UPPER_CAMEL_CASEProps,
  PAGE_NAME_UPPER_CAMEL_CASEState
  > {
  state: PAGE_NAME_UPPER_CAMEL_CASEState = {
    chk: 1,
    countDownE: 0, //邮箱验证码倒计时
    countDownP: 0, //手机验证码倒计时
    saveTel: '',
    saveEmail: '',
    visible: false,
    confirmLoading: false,
    currentFile: null,
    loading: false,
    imageUrl: null,
  };
  changeAvatar = () => {
    this.setState({ visible: true });
  };
  uploadOk = () => {
    this.setState({ confirmLoading: true });
    const { currentFile } = this.state;
    const { dispatch } = this.props;
    if (currentFile) {
      dispatch({
        type: 'BLOCK_NAME_CAMEL_CASE/updateAvatar',
        payload: currentFile,
      });
    } else {
      message.error(formatMessage({ id: 'BLOCK_NAMEmessage.uploadfile' }));
      this.setState({ loading: false, confirmLoading: false });
      return;
    }
    setTimeout(() => {
      this.setState({ visible: false, confirmLoading: false, imageUrl: null, currentFile: null });
    }, 2000);
  };

  beforeUpload = (file: File) => {
    const isJPG = file.type === 'image/jpeg';
    const isPNG = file.type === 'image/png';
    if (!isJPG && !isPNG) {
      message.error(formatMessage({ id: 'BLOCK_NAME.message.uploadfilePngJpg' }));
      this.setState({ loading: false });
      return false;
    }
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error(formatMessage({ id: 'BLOCK_NAME.message.file1Mb' }));
      this.setState({ loading: false });
      return false;
    }
    getBase64(file, (imageUrl: any) =>
      this.setState({
        imageUrl,
        loading: false,
      }),
    );
    this.setState({ currentFile: file });
    return false;
  };
  handleChkChanged = (val: any) => {
    this.setState({
      chk: val,
    });
  };
  /**
   * @isInfo 是否是修改信息,如果是false,代表在修改手机号或者邮箱
   */
  submitInfo = (fields: Array<string>, type: any, isInfo: boolean = true) => {
    const { resetFields, validateFields } = this.props.form;
    const { dispatch } = this.props;
    // const { onOK } = this.props;
    validateFields(fields, (err, values: UserFormProps) => {
      if (!err) {
        //这一步需要根据 isInfo 做判断 调用哪个接口
        if (isInfo) {
          let alertNotificationType = parseInt(sum(values.alertNotificationType).toString(), 2);
          dispatch({
            type: 'BLOCK_NAME_CAMEL_CASE/updateUserInfo',
            payload: {
              alertNotificationType,
              gender: values.gender,
              job: values.job,
              jobNumber: values.jobNumber,
              name: values.name,
            },
            callback: () => {
              resetFields();
              this.setState({
                chk: 1,
              });
            },
          });
        } else {
          //调用修改手机或者邮箱接口 根据fields判断
          let tempKey = fields[0];
          let tempVal = get(values, `[${tempKey}]`)
          let tempVal2 = get(values, `[${fields[1]}]`)
          if (tempKey == 'email') {
            if (!this.state.saveEmail || this.state.saveEmail != tempVal) {
              message.warning(formatMessage({ id: 'BLOCK_NAME.message.mailAtypism' }));
              return;
            }
          } else {
            if (!this.state.saveTel || this.state.saveTel != tempVal) {
              message.warning(formatMessage({ id: 'BLOCK_NAME.message.phoneAtypism' }));
              return;
            }
          }
          dispatch({
            type: 'BLOCK_NAME_CAMEL_CASE/bindingEmailOrMobile',
            payload: {
              account: tempVal,
              media: tempKey,
              code: tempVal2,
            },
            callback: () => {
              resetFields();
              this.setState({
                chk: 1,
              });
            },
          });
        }
      }
    });
  };
  getCode = (fields: any, type: any) => {
    const {
      dispatch,
      form: { validateFields },
    } = this.props;
    validateFields(fields, (err, values) => {
      if (!err) {
        dispatch({
          type: 'BLOCK_NAME_CAMEL_CASE/sendCode',
          payload: {
            account: type == 'email' ? values.email : values.mobile,
            media: type,
          },
          callback: (res: any) => {
            if (res.code == 0) {
              if (type == 'email') {
                this.setState({ countDownE: 60, saveEmail: values.email }, () => {
                  let count = setInterval(() => {
                    if (this.state.countDownE > 0) {
                      this.setState({ countDownE: this.state.countDownE - 1 });
                    } else {
                      clearInterval(count);
                    }
                  }, 1000);
                });
              } else {
                this.setState({ countDownP: 60, saveTel: values.mobile }, () => {
                  if (this.state.countDownP > 0) {
                    let count = setInterval(() => {
                      if (this.state.countDownP > 0) {
                        this.setState({ countDownP: this.state.countDownP - 1 });
                      } else {
                        clearInterval(count);
                      }
                    }, 1000);
                  }
                });
              }
            }
          },
        });
      }
    });
  };
  submitPwd = () => {
    const { resetFields, validateFields } = this.props.form;
    const { dispatch } = this.props;
    // const { onOK } = this.props;
    validateFields((err, values) => {
      if (!err) {
        dispatch({
          type: 'BLOCK_NAME_CAMEL_CASE/updatePassword',
          payload: {
            data: {
              newPwd: values.newPwd,
              oldPwd: values.oldPwd,
            },
          },
          callback: () => {
            resetFields();
            setTimeout(() => {
              localStorage.setItem('token', '');
              router.push('/user/login');
            }, 2000);
          },
        });
      }
    });
  };
  chkNewPwd = (rule: any, value: any, callback: any) => {
    if (this.state.chk == 3) {
      if (value.length < 6) {
        callback(formatMessage({ id: 'BLOCK_NAME.message.length6' }));
      } else if (value.length > 16) {
        callback(formatMessage({ id: 'BLOCK_NAME.message.lengthLimit' }));
      } else {
        callback();
      }
    } else {
      callback();
    }
  };
  chkConfirm = (rule: any, value: any, callback: Function) => {
    const form = this.props.form;
    if (this.state.chk == 3) {
      if (value && value !== form.getFieldValue('newPwd')) {
        callback(formatMessage({ id: 'BLOCK_NAME.twoInputsDifferent' }));
      } else {
        callback();
      }
    } else {
      callback();
    }
  };
  //计算报警推送选中项规则
  notiTypeChk = (value: any) => {
    let arr = [];
    let to2 = padStart(value.toString(2), 3, '0');
    for (let i = 0; i < to2.length; i++) {
      const word = to2.substr(i, 1);
      if (word == '1') {
        if (i === 0) arr.push(100);
        if (i === 1) arr.push(10);
        if (i === 2) arr.push(1);
      }
    }
    return arr;
  };
  //计算报警推送选中项文字
  notiTypeText = (value: number) => {
    let key = '';
    switch (value) {
      case 1:
        key = 'msg'
        break;
      case 10:
        key = 'email'
        break;
      default:
        key = 'mobile'
        break;
    }
    return this.notiTypeChk(value)
      .map(o => {
        return formatMessage({ id: `BLOCK_NAME.push.${key}` })
      })
      .join(',');
  };

  render() {
    const { visible, confirmLoading, chk, countDownE, countDownP } = this.state;
    const { getFieldDecorator, resetFields } = this.props.form;
    const imageUrl = this.state.imageUrl;
    let currentUser = getSessionInfo('currentUser');
    const uploadButton = (
      <div style={{ width: '200px', height: '200px', paddingTop: '80px' }}>
        <Icon type={this.state.loading ? 'loading' : 'plus'} />
        <div className="ant-upload-text">
          <FormattedMessage id="BLOCK_NAME.user.uploadAvatar" />
        </div>
      </div>
    );

    //选中样式
    const style = {
      width: '100%',
      marginBottom: 5,
      padding: '10px 0',
      background: '#7BC0FF',
      color: '#FFFFFF',
      border: 0,
      height: 40,
    };
    //未选中样式
    const style2 = {
      width: '100%',
      marginBottom: 5,
      padding: '10px 0',
      background: '#CDE7FF',
      color: '#1890FF',
      border: 0,
      height: 40,
    };
    const imgStyle = {
      margin: '0 5px 4px 10px',
    };

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    let pushWayList = [
      { id: 1, label: formatMessage({ id: 'BLOCK_NAME.push.msg' }), value: 1 },
      { id: 2, label: formatMessage({ id: 'BLOCK_NAME.push.email' }), value: 10 },
      { id: 3, label: formatMessage({ id: 'BLOCK_NAME.push.mobile' }), value: 100 },
    ];

    if (!getSessionInfo('deploymentType').emailNotification) {
      pushWayList = [{ id: 1, label: formatMessage({ id: 'BLOCK_NAME.push.msg' }), value: 1 }];
    }
    return <PageHeaderWrapper>
      <Form>
        <Row>
          <Col span={4} style={{ textAlign: 'center', boxShadow: 'rgba(0,21,41,.12) 0 0 10px' }}>
            <div
              style={{
                background: '#F6FBFF',
                marginBottom: 5,
                padding: '45px 0 25px 0',
                position: 'relative',
                boxShadow: 'rgba(0,21,41,.12) 0 3px 3px',
              }}
            >
              {currentUser.headIcon ? (
                <Avatar
                  src={currentUser.headIcon}
                  alt={formatMessage({ id: 'BLOCK_NAME.imgFailure' })}
                  size={116}
                  style={{ border: '3px solid #B0D9FF', objectFit: 'cover' }}
                  className={styles.avatarImg}
                />
              ) : (
                  <img src={require('./assets/avatar.png')} />
                )}
              <img
                src={require('./assets/avatar-edit.png')}
                onClick={this.changeAvatar}
                style={{ position: 'absolute', right: '30%', bottom: '30%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: 20, fontWeight: 'bold' }}>{currentUser.name}</div>
            </div>
            <div style={{ padding: 5 }}>
              <div>
                <Button
                  style={chk == 1 ? style : style2}
                  onClick={() => this.handleChkChanged(1)}
                >
                  <img
                    src={require(`./assets/people${chk == 1 ? '-hover' : ''}.png`)}
                    style={imgStyle}
                  />
                  <FormattedMessage id="BLOCK_NAME.user.personalInfo" />
                </Button>
              </div>
              <div>
                <Button
                  style={chk == 2 ? style : style2}
                  onClick={() => this.handleChkChanged(2)}
                >
                  <img
                    src={require(`./assets/edit${chk == 2 ? '-hover' : ''}.png`)}
                    style={imgStyle}
                  />
                  <FormattedMessage id="BLOCK_NAME.modify_info" />
                </Button>
              </div>
              <div>
                <Button
                  style={chk == 3 ? style : style2}
                  onClick={() => this.handleChkChanged(3)}
                >
                  <img
                    src={require(`./assets/lock${chk == 3 ? '-hover' : ''}.png`)}
                    style={imgStyle}
                  />
                  <FormattedMessage id="BLOCK_NAME.modifyPassword" />
                </Button>
              </div>
            </div>
          </Col>
          <Col span={20}>
            <Row style={chk == 1 ? {} : { display: 'none' }}>
              <div style={{ position: 'relative', margin: '15px 0 10px 8%' }}>
                <img src={require('./assets/menu.png')} />
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 20,
                    color: '#fff',
                    lineHeight: '32px',
                  }}
                >
                  <FormattedMessage id="BLOCK_NAME.user.personalInfo" />
                </span>
              </div>
              <Col span={12}>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.account' })}
                >
                  {currentUser.username}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.jobNumber' })}
                >
                  {currentUser.jobNum}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.department' })}
                >
                  {currentUser.departmentName || formatMessage({ id: 'BLOCK_NAME.none' })}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.job' })}
                >
                  {currentUser.job || formatMessage({ id: 'BLOCK_NAME.none' })}
                </FormItem>
              </Col>
              <Col span={12}>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.alertPush' })}
                >
                  {this.notiTypeText(currentUser.alertNotificationType) ||
                    formatMessage({ id: 'BLOCK_NAME.none' })}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.email' })}
                >
                  {currentUser.email || formatMessage({ id: 'BLOCK_NAME.none' })}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.mobile' })}
                >
                  {currentUser.mobile || formatMessage({ id: 'BLOCK_NAME.none' })}
                </FormItem>
                <FormItem
                  {...formItemLayout}
                  label={formatMessage({ id: 'BLOCK_NAME.user.sex' })}
                >
                  {currentUser.gender == 'female'
                    ? formatMessage({ id: 'BLOCK_NAME.user.female' })
                    : formatMessage({ id: 'BLOCK_NAME.user.male' })}
                </FormItem>
              </Col>
            </Row>
            {chk == 2 ? (
              <div>
                <Row gutter={24}>
                  <div style={{ position: 'relative', margin: '15px 0 10px 8%' }}>
                    <img src={require('./assets/menu.png')} />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 20,
                        color: '#fff',
                        lineHeight: '32px',
                      }}
                    >
                      <FormattedMessage id="BLOCK_NAME.modify_info" />
                    </span>
                  </div>
                  <Col span={10}>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.index.name' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      {getFieldDecorator('name', {
                        initialValue: currentUser.name || '',
                        rules: [
                          {
                            required: chk == 2 && true,
                            whitespace: true,
                            message: formatMessage({ id: 'please.input.name' }),
                          },
                        ],
                      })(<Input placeholder={formatMessage({ id: 'BLOCK_NAME.required' })} />)}
                    </FormItem>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.user.jobNumber' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      {getFieldDecorator('jobNumber', {
                        initialValue: currentUser.jobNum || '',
                        rules: [
                          {
                            required: chk == 2 && true,
                            whitespace: true,
                            message: formatMessage({ id: 'please.input.jobNumber' }),
                          },
                        ],
                      })(<Input placeholder={formatMessage({ id: 'BLOCK_NAME.required' })} />)}
                    </FormItem>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.user.job' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      {getFieldDecorator('job', {
                        initialValue: currentUser.job || '',
                        rules: [{ validator: validator_noSpace }],
                      })(<Input placeholder={formatMessage({ id: 'BLOCK_NAME.optional' })} />)}
                    </FormItem>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.user.department' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        disabled={true}
                        defaultValue={
                          currentUser.departmentName
                            ? currentUser.departmentName
                            : formatMessage({ id: 'BLOCK_NAME.null' })
                        }
                      ></Select>
                    </FormItem>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.user.sex' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      {getFieldDecorator('gender', {
                        initialValue: currentUser.gender || '',
                      })(
                        <Select placeholder={formatMessage({ id: 'BLOCK_NAME.pleaseChoose' })}>
                          <Option key={'male'} value={'male'}>
                            {formatMessage({ id: 'BLOCK_NAME.user.male' })}
                          </Option>
                          <Option key={'female'} value={'female'}>
                            {formatMessage({ id: 'BLOCK_NAME.user.female' })}
                          </Option>
                        </Select>,
                      )}
                    </FormItem>
                    <FormItem
                      label={formatMessage({ id: 'BLOCK_NAME.user.pushMode' })}
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                    >
                      {getFieldDecorator('alertNotificationType', {
                        initialValue: this.notiTypeChk(currentUser.alertNotificationType),
                      })(
                        <Checkbox.Group
                          onChange={val => {
                            console.log(val);
                          }}
                          style={{ width: '100%' }}
                        >
                          {pushWayList.map((item, index, arr) => {
                            return (
                              <Checkbox key={item.id} value={item.value}>
                                {item.label}
                              </Checkbox>
                            );
                          })}
                        </Checkbox.Group>,
                      )}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0, marginLeft: '33.33%' }}
                    >
                      <Button
                        type="primary"
                        onClick={() =>
                          this.submitInfo(
                            ['alertNotificationType', 'gender', 'job', 'jobNumber', 'name'],
                            null,
                          )
                        }
                      >
                        <FormattedMessage id="BLOCK_NAME.user.saveChanges" />
                      </Button>
                      <Button
                        onClick={() => {
                          resetFields();
                        }}
                        style={{ marginLeft: 10 }}
                      >
                        <FormattedMessage id="BLOCK_NAME.user.reduction" />
                      </Button>
                    </FormItem>
                  </Col>
                  <Col span={10}>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                      label={formatMessage({ id: 'BLOCK_NAME.user.email' })}
                    >
                      {getFieldDecorator('email', {
                        rules: [
                          {
                            required: chk == 2 && true,
                            message: formatMessage({ id: 'please.input.Mailbox' }),
                          },
                          {
                            type: 'email',
                            message: formatMessage({ id: 'incorrect.mailboxFormat' }),
                          },
                        ],
                      })(<Input />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                      label={formatMessage({ id: 'BLOCK_NAME.user.captcha' })}
                    >
                      {getFieldDecorator('emailcode', {
                        rules: [
                          {
                            required: chk == 2 && true,
                            message: formatMessage({ id: 'please.input.Captcha' }),
                          },
                        ],
                      })(<Input style={{ width: '30%', marginRight: 5 }} maxLength={6} />)}
                      <Button
                        style={{ color: '#1890FF', border: '1px solid #1890FF' }}
                        onClick={() => {
                          if (!countDownE) {
                            this.getCode(['email'], 'email');
                          }
                        }}
                      >
                        {countDownE == 0
                          ? formatMessage({ id: 'BLOCK_NAME.user.getCaptcha' })
                          : `${countDownE}s`}
                      </Button>
                    </FormItem>
                    <Button
                      type="primary"
                      style={{ margin: '0 0 0 33.33%' }}
                      onClick={() => this.submitInfo(['email', 'emailcode'], 'email', false)}
                    >
                      <FormattedMessage id="BLOCK_NAME.user.determine" />
                    </Button>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                      label={formatMessage({ id: 'BLOCK_NAME.user.mobile' })}
                    >
                      {getFieldDecorator('mobile', {
                        rules: [
                          {
                            required: chk == 2 && true,
                            message: formatMessage({ id: 'please.input.Mobile' }),
                          },
                          {
                            pattern: new RegExp(mobileReg),
                            message: formatMessage({ id: 'please.input.connectMobile' }),
                          },
                        ],
                      })(<Input />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0 }}
                      label={formatMessage({ id: 'BLOCK_NAME.user.captcha' })}
                    >
                      {getFieldDecorator('mobilecode', {
                        rules: [
                          {
                            required: chk == 2 && true,
                            message: formatMessage({ id: 'please.input.Captcha' }),
                          },
                        ],
                      })(<Input style={{ width: '30%', marginRight: 5 }} maxLength={6} />)}
                      <Button
                        style={{ color: '#1890FF', border: '1px solid #1890FF' }}
                        onClick={() => {
                          if (!countDownP) {
                            this.getCode(['mobile'], 'mobile');
                          }
                        }}
                      >
                        {countDownP == 0
                          ? formatMessage({ id: 'BLOCK_NAME.user.getCaptcha' })
                          : `${countDownP}s`}
                      </Button>
                    </FormItem>
                    <Button
                      type="primary"
                      style={{ margin: '0 0 0 33.33%' }}
                      onClick={() => this.submitInfo(['mobile', 'mobilecode'], 'mobile', false)}
                    >
                      <FormattedMessage id="BLOCK_NAME.user.determine" />
                    </Button>
                  </Col>
                </Row>
              </div>
            ) : (
                ''
              )}
            {chk == 3 ? (
              <div>
                <Row gutter={24}>
                  <div style={{ position: 'relative', margin: '15px 0 10px 8%' }}>
                    <img src={require('./assets/menu.png')} />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 20,
                        color: '#fff',
                        lineHeight: '32px',
                      }}
                    >
                      <FormattedMessage id="BLOCK_NAME.modifyPassword" />
                    </span>
                  </div>
                  <Col span={10}>
                    <FormItem
                      {...formItemLayout}
                      label={formatMessage({ id: 'BLOCK_NAME.user.oldPassword' })}
                    >
                      {getFieldDecorator('oldPwd', {
                        rules: [
                          {
                            required: chk == 3 && true,
                            message: formatMessage({ id: 'please.input.oldPassword' }),
                          },
                        ],
                      })(<Input type="password" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      label={formatMessage({ id: 'BLOCK_NAME.user.newPassword' })}
                    >
                      {getFieldDecorator('newPwd', {
                        rules: [
                          {
                            required: chk == 3 && true,
                            message: formatMessage({ id: 'please.input.newPassword' }),
                          },
                          {
                            whitespace: true,
                            message: formatMessage({ id: 'infor.cannotAllSpace' }),
                          },
                          {
                            validator: this.chkNewPwd,
                          },
                        ],
                      })(<Input type="password" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      label={formatMessage({ id: 'BLOCK_NAME.user.confirmNewPassword' })}
                    >
                      {getFieldDecorator('confirm', {
                        rules: [
                          {
                            required: chk == 3 && true,
                            message: formatMessage({ id: 'please.confirm.newPassword' }),
                          },
                          {
                            validator: this.chkConfirm,
                          },
                        ],
                      })(<Input type="password" />)}
                    </FormItem>
                    <FormItem
                      {...formItemLayout}
                      style={{ marginBottom: 0, marginLeft: '33.33%' }}
                    >
                      <Button type="primary" onClick={this.submitPwd}>
                        <FormattedMessage id="BLOCK_NAME.user.saveChanges" />
                      </Button>
                      <Button
                        onClick={() => {
                          resetFields();
                        }}
                        style={{ marginLeft: 10 }}
                      >
                        <FormattedMessage id="BLOCK_NAME.empty" />
                      </Button>
                    </FormItem>
                  </Col>
                </Row>
              </div>
            ) : null}
          </Col>
        </Row>
      </Form>
      <Modal
        title={formatMessage({ id: 'BLOCK_NAME.user.updateAvatar' })}
        visible={visible}
        onOk={this.uploadOk}
        confirmLoading={confirmLoading}
        onCancel={() => {
          this.setState({ visible: false, imageUrl: null, currentFile: null });
        }}
        width={460}
      >
        <div style={{ width: '340px', height: '220px', paddingLeft: '55px' }}>
          <Upload
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={this.beforeUpload}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="avatar"
                style={{ maxHeight: '200px', maxWidth: '200px', height: '200px', width: '200px' }}
              />
            ) : (
                uploadButton
              )}
          </Upload>
        </div>
      </Modal>
    </PageHeaderWrapper>
  }
}

export default connect(
  ({
    BLOCK_NAME_CAMEL_CASE,
  }: {
    BLOCK_NAME_CAMEL_CASE: StateType;
  }) => ({
    currentUser: BLOCK_NAME_CAMEL_CASE.currentUser,
  }),
)(Form.create()(PAGE_NAME_UPPER_CAMEL_CASE));
