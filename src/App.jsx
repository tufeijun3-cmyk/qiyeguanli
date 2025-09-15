import React, { useState, useEffect } from 'react'
import { databaseService } from './supabase'
import ExpenseForm from './components/ExpenseForm'
import ExpenseFormTest from './components/ExpenseForm_Test'
import LeaderView from './components/LeaderView'
import SupervisorView from './components/SupervisorView'
import FinanceView from './components/FinanceView'
import AdminView from './components/AdminView'
import Dashboard from './components/Dashboard'
import EmployeeDashboard from './components/EmployeeDashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [role, setRole] = useState('employee')
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [availableRoles, setAvailableRoles] = useState({})

  // 加载所有用户数据
  const loadUsers = async () => {
    try {
      const users = await databaseService.getUsers()
      setAllUsers(users)
      
      // 按角色分组用户
      const roleGroups = {}
      users.forEach(user => {
        if (!roleGroups[user.role]) {
          roleGroups[user.role] = []
        }
        roleGroups[user.role].push(user)
      })
      setAvailableRoles(roleGroups)
      
      console.log('用户数据加载完成:', { users: users.length, roleGroups })
    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  }

  // 加载仪表板数据
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const data = await databaseService.getDashboardData(role, user?.id)
      setDashboardData(data)
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理子组件的成功回调
  const handleSuccess = (action) => {
    if (action === 'openExpenseForm') {
      // 切换到申请表单页面
      setCurrentPage('expenses')
    } else {
      // 其他情况重新加载数据
      loadDashboardData()
    }
  }


  // 初始化加载用户数据
  useEffect(() => {
    loadUsers()
  }, [])

  // 角色变化时更新用户和数据
  useEffect(() => {
    if (availableRoles[role] && availableRoles[role].length > 0) {
      // 选择该角色的第一个用户
      const newUser = availableRoles[role][0]
      setUser(newUser)
      setCurrentPage('dashboard')
      console.log(`切换到${role}角色，选择用户:`, newUser)
    }
  }, [role, availableRoles])

  // 用户变化时加载数据
  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  // 订阅数据变化
  useEffect(() => {
    const unsubscribe = databaseService.subscribe(() => {
      loadDashboardData()
    })
    return unsubscribe
  }, [user])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">加载中...</div>
          </div>
                </div>
      )
    }

    // 员工角色使用专门的EmployeeDashboard
    if (role === 'employee') {
      return <EmployeeDashboard user={user} onSuccess={loadDashboardData} />
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={dashboardData} role={role} user={user} />
      case 'expenses':
        return <ExpenseForm user={user} onSuccess={loadDashboardData} />
      case 'leader':
        return <LeaderView user={user} onSuccess={handleSuccess} />
      case 'supervisor':
        return <SupervisorView user={user} onSuccess={loadDashboardData} />
      case 'finance':
        return <FinanceView user={user} onSuccess={loadDashboardData} />
      case 'admin':
        return <AdminView user={user} onSuccess={loadDashboardData} />
      default:
        return <Dashboard data={dashboardData} role={role} user={user} />
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'employee': return '👤'
      case 'team_leader': return '👨‍💼'
      case 'supervisor': return '👨‍💻'
      case 'finance': return '💰'
      case 'admin': return '⚙️'
      default: return '👤'
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 'employee': return '员工'
      case 'team_leader': return '组长'
      case 'supervisor': return '主管'
      case 'finance': return '财务'
      case 'admin': return '管理员'
      default: return '员工'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">企</span>
            </div>
                <h1 className="text-xl font-bold text-gray-900">企业管理系统</h1>
                      </div>
                    </div>
                    
            <div className="flex items-center space-x-4">
              {/* 页面导航 - 员工角色不显示 */}
              {role !== 'employee' && (
                <div className="hidden md:flex space-x-1">
              <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === 'dashboard' 
                        ? 'bg-blue-100 text-blue-700 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    📊 仪表板
              </button>
              {(role === 'finance' || role === 'admin') && (
              <button
                  onClick={() => setCurrentPage('expenses')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 'expenses' 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  📋 申请管理
              </button>
              )}
                  {role === 'team_leader' && (
                        <button
                      onClick={() => setCurrentPage('leader')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'leader' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      👨‍💼 组长管理
                        </button>
                  )}
                  {role === 'supervisor' && (
              <button
                      onClick={() => setCurrentPage('supervisor')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'supervisor' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      👨‍💻 主管管理
              </button>
                  )}
                  {role === 'finance' && (
              <button
                      onClick={() => setCurrentPage('finance')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'finance' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      💰 财务管理
              </button>
                  )}
                  {role === 'admin' && (
            <button
                      onClick={() => setCurrentPage('admin')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === 'admin' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      ⚙️ 系统管理
            </button>
                  )}
            </div>
              )}
              
        {/* 角色切换 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">角色:</span>
        <div className="flex space-x-1">
                  {Object.keys(availableRoles).map((roleKey) => {
                    const userCount = availableRoles[roleKey]?.length || 0
                    return (
          <button 
                        key={roleKey}
                        onClick={() => setRole(roleKey)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                          role === roleKey 
                            ? 'bg-green-100 text-green-700 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                        title={`${getRoleName(roleKey)} (${userCount}人)`}
                      >
                        {getRoleIcon(roleKey)}
                        {userCount > 0 && (
                          <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                            {userCount}
            </span>
                        )}
          </button>
                    )
                  })}
        </div>
        </div>
            
              {/* 用户选择器 */}
              {availableRoles[role] && availableRoles[role].length > 1 && (
                <div className="relative">
                <select 
                    value={user?.id || ''}
                    onChange={(e) => {
                      const selectedUser = availableRoles[role].find(u => u.id === e.target.value)
                      if (selectedUser) {
                        setUser(selectedUser)
                        console.log('切换用户:', selectedUser)
                      }
                    }}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles[role].map((userOption) => (
                      <option key={userOption.id} value={userOption.id}>
                        {userOption.name}
                      </option>
                    ))}
                </select>
              </div>
              )}

              {/* 用户信息 */}
              <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <div className="text-gray-500">{getRoleName(role)}</div>
              </div>
            </div>
                </div>
                </div>
                </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in">
          {renderContent()}
                        </div>
                        </div>
                  
      {/* 移动端侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">企</span>
              </div>
                <h1 className="ml-3 text-lg font-semibold text-gray-900">企业管理系统</h1>
            </div>
              <nav className="mt-5 px-2 space-y-1">
                        <button
                  onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  📊 仪表板
                        </button>
                        {(role === 'finance' || role === 'admin') && (
                        <button
                            onClick={() => { setCurrentPage('expenses'); setSidebarOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          >
                            📋 申请管理
                        </button>
                )}
            </nav>
              </div>
            </div>
          </div>
        )}
            </div>
  )
}