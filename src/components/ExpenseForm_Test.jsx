import React, { useState } from 'react'

export default function ExpenseFormTest({ user, onSuccess }) {
  const [form, setForm] = useState({
    amount: '',
    purpose: '',
    type: '差旅费',
    note: '',
    paymentMethod: '银行转账',
    payeeName: '',
    payeeContact: '',
    payeeAccount: '',
    payeeBank: ''
  })
  const [step, setStep] = useState(1)

  const nextStep = () => {
    if (step === 1 && form.type && form.amount) {
      setStep(2)
    } else if (step === 2 && form.purpose) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step === 3) {
      setStep(2)
    } else if (step === 2) {
      setStep(1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">提交支出申请</h2>
              <p className="text-blue-100 text-sm">填写申请信息，系统将自动进行AI审核</p>
            </div>
            <div className="text-3xl opacity-80">📝</div>
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">基本信息</span>
            </div>
            <div className={`w-6 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">详细信息</span>
            </div>
            <div className={`w-6 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">财务信息</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">选择申请类型和金额</h3>
                <p className="text-gray-600">请选择您的申请类型并输入金额</p>
              </div>

              {/* 申请类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">申请类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="差旅费">差旅费</option>
                  <option value="办公用品">办公用品</option>
                  <option value="设备采购">设备采购</option>
                  <option value="培训费">培训费</option>
                  <option value="会议费">会议费</option>
                  <option value="交通费">交通费</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* 申请金额 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">申请金额 (元)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-lg">¥</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="请输入金额"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!form.type || !form.amount}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步 →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">填写详细信息</h3>
                <p className="text-gray-600">请详细说明申请用途和相关信息</p>
              </div>

              {/* 申请摘要 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">申请摘要</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>类型: {form.type}</span>
                  <span>金额: ¥{form.amount}</span>
                </div>
              </div>

              {/* 用途说明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用途说明</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({...form, purpose: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请详细说明申请用途，包括具体项目、时间、地点等信息"
                  required
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({...form, note: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="其他需要说明的信息（可选）"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  ← 上一步
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!form.purpose}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步 →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">填写财务信息</h3>
                <p className="text-gray-600">请填写付款方式和收款人信息</p>
              </div>

              {/* 申请摘要 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">申请摘要</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>类型: {form.type}</span>
                  <span>金额: ¥{form.amount}</span>
                  <span>用途: {form.purpose}</span>
                </div>
              </div>

              {/* 付款方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">付款方式</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({...form, paymentMethod: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="银行转账">银行转账</option>
                  <option value="支付宝">支付宝</option>
                  <option value="微信支付">微信支付</option>
                  <option value="现金">现金</option>
                  <option value="支票">支票</option>
                </select>
              </div>

              {/* 收款人信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">收款人姓名 *</label>
                  <input
                    type="text"
                    value={form.payeeName}
                    onChange={(e) => setForm({...form, payeeName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入收款人姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">联系方式 *</label>
                  <input
                    type="text"
                    value={form.payeeContact}
                    onChange={(e) => setForm({...form, payeeContact: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="手机号或邮箱"
                    required
                  />
                </div>
              </div>

              {/* 银行信息 */}
              {form.paymentMethod === '银行转账' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">开户银行 *</label>
                    <input
                      type="text"
                      value={form.payeeBank}
                      onChange={(e) => setForm({...form, payeeBank: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="如：中国工商银行"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">银行账号 *</label>
                    <input
                      type="text"
                      value={form.payeeAccount}
                      onChange={(e) => setForm({...form, payeeAccount: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="请输入银行账号"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 支付宝/微信账号 */}
              {(form.paymentMethod === '支付宝' || form.paymentMethod === '微信支付') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {form.paymentMethod === '支付宝' ? '支付宝账号' : '微信账号'} *
                  </label>
                  <input
                    type="text"
                    value={form.payeeAccount}
                    onChange={(e) => setForm({...form, payeeAccount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={form.paymentMethod === '支付宝' ? '支付宝账号或手机号' : '微信号或手机号'}
                    required
                  />
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  ← 上一步
                </button>
                <button
                  type="button"
                  onClick={() => alert('测试完成！新表单功能正常')}
                  disabled={!form.payeeName || !form.payeeContact || !form.payeeAccount}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  测试完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
