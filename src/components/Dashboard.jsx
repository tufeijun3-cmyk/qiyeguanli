import React from 'react'

export default function Dashboard({ data, role, user }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  const { stats, expenses, customers, devices } = data

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  const ExpenseCard = ({ expense }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {expense.creator?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{expense.creator?.name || '未知用户'}</p>
            <p className="text-sm text-gray-500">{expense.team?.name || '未知团队'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">¥{expense.amount}</p>
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            expense.status === 'submitted' ? 'status-pending' :
            expense.status === 'waiting_supervisor' ? 'status-waiting' :
            expense.status === 'waiting_finance' ? 'status-waiting' :
            expense.status === 'paid' ? 'status-approved' : 'status-rejected'
          }`}>
            {expense.status === 'submitted' ? '待审批' :
             expense.status === 'waiting_supervisor' ? '待主管审批' :
             expense.status === 'waiting_finance' ? '待财务审批' :
             expense.status === 'paid' ? '已支付' : '已拒绝'}
          </span>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-700">{expense.purpose}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(expense.applied_at).toLocaleDateString()}</span>
        <span>{new Date(expense.applied_at).toLocaleTimeString()}</span>
      </div>
    </div>
  )

  const CustomerCard = ({ customer }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{customer.name}</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {customer.source}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{customer.contact}</p>
      <div className="flex items-center text-xs text-gray-500">
        <span className="mr-2">👤 {customer.owner?.name || '未分配'}</span>
        <span>{new Date(customer.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )

  const DeviceCard = ({ device }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">
            {device.type === 'laptop' ? '💻' : 
             device.type === 'phone' ? '📱' : 
             device.type === 'tablet' ? '📱' : '🖥️'}
          </span>
          <h3 className="font-medium text-gray-900">{device.type}</h3>
        </div>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          {device.returned_at ? '已归还' : '使用中'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{device.vendor} - {device.sn}</p>
      <div className="flex items-center text-xs text-gray-500">
        <span className="mr-2">👤 {device.user?.name || '未分配'}</span>
        <span>{new Date(device.assigned_at).toLocaleDateString()}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              欢迎回来，{user?.name || '用户'}！
            </h2>
            <p className="text-blue-100">
              今天是 {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="text-4xl opacity-80">
            {role === 'employee' ? '👤' : 
             role === 'team_leader' ? '👨‍💼' :
             role === 'supervisor' ? '👨‍💻' :
             role === 'finance' ? '💰' : '⚙️'}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总申请数"
          value={stats.totalExpenses}
          icon="📋"
          color="bg-blue-100 text-blue-600"
          trend={12}
        />
        <StatCard
          title="待审批"
          value={stats.pendingExpenses}
          icon="⏳"
          color="bg-yellow-100 text-yellow-600"
          trend={-5}
        />
        <StatCard
          title="已批准金额"
          value={`¥${stats.totalAmount.toFixed(2)}`}
          icon="💰"
          color="bg-green-100 text-green-600"
          trend={8}
        />
        {role !== 'finance' && (
          <StatCard
            title="客户数"
            value={stats.totalCustomers}
            icon="👥"
            color="bg-purple-100 text-purple-600"
            trend={15}
          />
        )}
      </div>


      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 最近申请 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">最近申请</h3>
                <span className="text-sm text-gray-500">{expenses.length} 条记录</span>
              </div>
            </div>
            <div className="p-6">
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-500">暂无申请记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.slice(0, 5).map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 客户概览 - 财务角色不显示 */}
          {role !== 'finance' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">客户概览</h3>
              </div>
              <div className="p-6">
                {customers.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">🏢</div>
                    <p className="text-gray-500 text-sm">暂无客户</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.slice(0, 3).map((customer) => (
                      <CustomerCard key={customer.id} customer={customer} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 设备概览 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">设备概览</h3>
            </div>
            <div className="p-6">
              {devices.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">📱</div>
                  <p className="text-gray-500 text-sm">暂无设备</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.slice(0, 3).map((device) => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}