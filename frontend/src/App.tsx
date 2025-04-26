import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Button,
  Card,
  Empty,
  Spin,
  Typography,
  Tag,
  List,
  Row,
  Col,
  Layout,
  Menu,
  Input,
  Divider,
  Space,
  Collapse,
  message,
  Tooltip
} from 'antd';
import {
  UploadOutlined,
  FileDoneOutlined,
  RocketOutlined,
  ExperimentOutlined,
  RobotOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios, { AxiosError } from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;
const { Panel } = Collapse;
const { TextArea } = Input;

// 添加自定义hook监听窗口大小
const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

interface AnalysisResult {
  summary: string; // 简历摘要
  keywords: string[]; // 关键词列表
  suggestions: string[]; // 优化建议列表
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [targetPosition, setTargetPosition] = useState<string>('');
  const [showResumeText, setShowResumeText] = useState<boolean>(false);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  const { width } = useWindowSize();
  const isMobile = width < 576;
  const isTablet = width >= 576 && width < 992;

  // 添加节流函数
  const throttle = (func: Function, delay: number) => {
    let inThrottle: boolean = false;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        inThrottle = true;
        func.apply(this, args);
        setTimeout(() => {
          inThrottle = false;
        }, delay);
      }
    };
  };

  // 使用节流的滚动函数
  const scrollToSection = throttle((sectionId: string) => {
    setActiveSection(sectionId);
    
    let targetRef;
    switch(sectionId) {
      case 'home':
        targetRef = heroRef;
        break;
      case 'features':
        targetRef = featuresRef;
        break;
      case 'upload':
        targetRef = uploadRef;
        break;
      case 'about':
        targetRef = aboutRef;
        break;
      default:
        targetRef = heroRef;
    }
    
    if (targetRef && targetRef.current) {
      window.scrollTo({
        top: targetRef.current.offsetTop - 64, // 64px是Header的高度
        behavior: 'smooth'
      });
    }
  }, 300); // 300ms的节流时间

  // 处理文件上传
  const handleFileSelect = (file: File) => {
    setFile(file);
    setUploadStatus(null);
    setResult(null);
    
    // 读取文件内容预览（仅简单示意）
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        setResumeText(e.target.result.substring(0, 500) + '...');
        setShowResumeText(true);
      }
    };
    reader.readAsText(file);
    
    message.success(`文件 ${file.name} 已选择`);
    
    return false; // 阻止默认上传行为
  };

  const handleAnalyze = async () => {
    if (!file) {
      message.error('请先上传简历文件');
      return;
    }
    
    setLoading(true);
    setUploadStatus(null);
    
    // 设置超时计时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        message.error('后端处理时间过长，请稍后重试');
        setLoading(false);
        setUploadStatus('error');
      }
    }, 30000); // 30秒超时提示
    
    const formData = new FormData();
    formData.append('file', file);
    if (targetPosition) {
      formData.append('position', targetPosition);
    }
    
    try {
      console.log('Uploading file:', file);
      // 明确使用环境变量 VITE_API_URL 作为基础 URL
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        console.error("错误：未设置 VITE_API_URL 环境变量。");
        message.error("API 地址未配置，请联系管理员。");
        setLoading(false);
        setUploadStatus('error');
        return; // 提前返回，避免无效请求
      }
      
      const response = await axios.post(`${apiUrl}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 设置超时时间为30秒
      });
      
      setResult(response.data);
      setUploadStatus('success');
      console.log('Response data:', response.data);
      message.success('简历分析完成！');
    } catch (err) {
      setUploadStatus('error');

      // 使用 AxiosError 进行更精确的检查
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError; // 现在可以安全地断言类型
        if (axiosError.code === 'ECONNABORTED') {
          console.error('请求超时 (ECONNABORTED)，请稍后重试');
          message.error('请求超时，请稍后重试');
        } else {
          // 处理其他 Axios 错误 (例如，服务器返回 4xx, 5xx)
          console.error('Axios 请求错误:', axiosError.response?.data || axiosError.message);
          // 安全地访问 detail 属性
          const detailMessage = (typeof axiosError.response?.data === 'object' && axiosError.response?.data !== null && 'detail' in axiosError.response.data) 
                                ? (axiosError.response.data as any).detail 
                                : axiosError.message;
          message.error(`请求失败: ${detailMessage}`);
        }
      } else if (err instanceof Error) {
          // 处理其他 JavaScript 错误
          console.error('JavaScript 错误:', err.message);
          message.error(`发生错误: ${err.message}`);
      } else {
          // 处理未知错误
          console.error('未知错误:', err);
          message.error('发生未知错误，请查看控制台。');
      }
    } finally {
      setLoading(false);
      // 清除超时计时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // 下载分析报告
  const handleDownloadReport = () => {
    if (!result) return;
    
    const content = `
# 简历分析报告

## 简历摘要
${result.summary}

## 关键技能
${result.keywords.join(', ')}

## 优化建议
${result.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '简历分析报告.md';
    a.click();
    URL.revokeObjectURL(url);
    
    message.success('报告已下载');
  };

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 渲染功能卡片
  const renderFeatureCard = (
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <Col xs={24} sm={12} md={6} style={{ marginBottom: isMobile ? 16 : 0 }}>
      <Card
        style={{ 
          height: '100%',
          minHeight: 200,
          textAlign: 'center',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }}>
          {icon}
        </div>
        <Title level={isMobile ? 5 : 4} style={{ marginBottom: 12 }}>
          {title}
        </Title>
        <Text type="secondary">{description}</Text>
      </Card>
    </Col>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 导航栏 */}
      <Header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 999, 
        width: '100%',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        padding: isMobile ? '0 16px' : '0 50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          fontSize: isMobile ? 18 : 20, 
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          ResumeMaster AI
        </div>
        
        {!isMobile && (
          <Menu
            mode="horizontal"
            selectedKeys={[activeSection]}
            style={{ flex: 1, justifyContent: 'center', border: 'none' }}
          >
            <Menu.Item key="home" onClick={() => scrollToSection('home')}>
              首页
            </Menu.Item>
            <Menu.Item key="features" onClick={() => scrollToSection('features')}>
              功能介绍
            </Menu.Item>
            <Menu.Item key="upload" onClick={() => scrollToSection('upload')}>
              简历上传
            </Menu.Item>
            <Menu.Item key="about" onClick={() => scrollToSection('about')}>
              关于我们
            </Menu.Item>
          </Menu>
        )}
        
        <Button 
          type="primary" 
          size={isMobile ? 'middle' : 'large'}
          onClick={() => scrollToSection('upload')}
          style={{ 
            borderRadius: 6, 
            fontWeight: 'bold',
            display: isMobile ? 'none' : 'block'
          }}
        >
          立即上传简历
        </Button>
        
        {isMobile && (
          <Button 
            type="primary" 
            size="middle"
            onClick={() => scrollToSection('upload')}
            style={{ borderRadius: 6 }}
          >
            上传简历
          </Button>
        )}
      </Header>
      
      <Content>
        {/* Hero区域 */}
        <div 
          ref={heroRef}
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 16px' : '80px 50px',
            background: 'linear-gradient(135deg, #f5f9ff 0%, #ecf6ff 100%)',
          }}
        >
          <Title 
            level={isMobile ? 2 : 1} 
            style={{ 
              marginBottom: 16,
              fontSize: isMobile ? 28 : (isTablet ? 36 : 48)
            }}
          >
            提升你的求职竞争力！
          </Title>
          
          <Title 
            level={isMobile ? 4 : 3} 
            type="secondary"
        style={{
              marginBottom: 32,
              fontWeight: 'normal',
              fontSize: isMobile ? 16 : (isTablet ? 20 : 24)
            }}
          >
            智能解析，精准优化，让简历直击HR痛点
          </Title>
          
          <Button
            type="primary"
            size={isMobile ? 'large' : 'large'}
            icon={<UploadOutlined />}
            onClick={() => scrollToSection('upload')}
            style={{ 
              height: isMobile ? 48 : 56,
              fontSize: isMobile ? 16 : 18,
              padding: '0 32px',
              borderRadius: 8,
              marginBottom: 16
            }}
          >
            上传简历
          </Button>
          
          <div>
            <Text type="secondary">
              支持PDF / DOCX / TXT格式
            </Text>
          </div>
          
          <div style={{ marginTop: 40 }}>
            <ArrowDownOutlined 
              style={{ 
                fontSize: 24, 
                color: '#1890ff',
                cursor: 'pointer'
              }} 
              onClick={() => scrollToSection('features')}
            />
          </div>
        </div>

        {/* 功能展示区 */}
        <div
          ref={featuresRef}
          style={{
            padding: isMobile ? '40px 16px' : '80px 50px',
            background: '#fff',
          }}
        >
          <Title 
            level={2} 
            style={{ 
              textAlign: 'center', 
              marginBottom: 50,
              fontSize: isMobile ? 24 : 32
            }}
          >
            核心功能介绍
          </Title>
          
          <Row gutter={[24, 24]}>
            {renderFeatureCard(
              <UploadOutlined />,
              "简历文件上传",
              "支持多种文件格式，快速提取简历内容"
            )}
            
            {renderFeatureCard(
              <ExperimentOutlined />,
              "自动内容提取",
              "智能识别简历中的关键信息和技能点"
            )}
            
            {renderFeatureCard(
              <RobotOutlined />,
              "智能分析处理",
              "基于DeepSeek AI进行深度语义分析"
            )}
            
            {renderFeatureCard(
              <BarChartOutlined />,
              "结果可视化展示",
              "清晰呈现分析结果和优化建议"
            )}
          </Row>
        </div>
        
        {/* 上传与分析区 */}
        <div
          ref={uploadRef}
          style={{
            padding: isMobile ? '40px 16px' : '80px 50px',
            background: '#f5f9ff',
          }}
        >
          <Row justify="center">
            <Col xs={24} sm={22} md={20} lg={18} xl={16}>
              <Card 
                style={{
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <Title 
                  level={3} 
                  style={{ 
                    marginBottom: 30,
                    textAlign: 'center'
                  }}
                >
                  <FileDoneOutlined style={{ marginRight: 10 }} />
                  简历上传与分析
                </Title>
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card
                      title="上传简历"
                      style={{ height: '100%' }}
                      extra={
                        <Tooltip title="仅用于分析，不保存用户数据">
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      }
                    >
                      <div style={{ 
                        marginBottom: 20,
                        textAlign: 'center' 
                      }}>
                        <Upload
                          beforeUpload={handleFileSelect}
                          showUploadList={false}
                          accept=".pdf,.docx,.doc,.txt"
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              size="large"
                            style={{ 
                              borderRadius: 8, 
                              padding: '0 32px',
                              width: isMobile ? '100%' : 'auto'
                            }}
                          >
                            选择简历文件
            </Button>
          </Upload>

                        <div style={{ marginTop: 12 }}>
                          <Text type="secondary">
                            支持 PDF / DOCX / TXT 格式
            </Text>
                        </div>
                      </div>
                      
                      {file && (
                        <div style={{ marginBottom: 20 }}>
                          <Card size="small" style={{ background: '#f9f9f9' }}>
                            <Text strong>{file.name}</Text>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              ({(file.size / 1024).toFixed(1)} KB)
            </Text>
                          </Card>
                          
                          {showResumeText && (
                            <Collapse 
                              ghost 
                              style={{ marginTop: 10 }}
                            >
                              <Panel 
                                header="查看简历内容预览" 
                                key="resume"
                              >
                                <div style={{ 
                                  maxHeight: 150, 
                                  overflow: 'auto',
                                  background: '#f9f9f9',
                                  padding: 10,
                                  borderRadius: 4,
                                  fontSize: 12
                                }}>
                                  {resumeText}
                                </div>
                              </Panel>
                            </Collapse>
          )}
        </div>
                      )}
                      
                      <div style={{ marginTop: 20 }}>
                        <Text>目标岗位（可选）：</Text>
                        <Input
                          placeholder="输入目标岗位，帮助AI更精准分析"
                          style={{ marginTop: 8 }}
                          value={targetPosition}
                          onChange={(e) => setTargetPosition(e.target.value)}
                        />
                      </div>
                      
                      <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Button
                          type="primary"
                          size="large"
                          onClick={handleAnalyze}
                          loading={loading}
                          disabled={!file}
                          style={{ 
                            width: isMobile ? '100%' : 'auto',
                            borderRadius: 8,
                            padding: '0 40px'
                          }}
                        >
                          开始分析
                        </Button>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card
                      title="分析结果"
                      style={{ height: '100%' }}
                    >
        {loading && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '40px 0',
                          minHeight: 300
                        }}>
                          <Spin size="large" tip="正在分析中..." />
                          <div style={{ marginTop: 16 }}>
                            <Text type="secondary">
                              正在使用AI深度分析你的简历...
                            </Text>
                          </div>
          </div>
        )}

                      {!loading && !result && (
                        <div style={{ minHeight: 300 }}>
                          <Empty
                            description={
                              <div>
                                {file ? '点击"开始分析"按钮分析简历' : '请先上传简历文件'}
                              </div>
                            }
                            style={{ padding: '40px 0' }}
                          />
                        </div>
                      )}
                      
        {!loading && result && (
                        <div style={{ minHeight: 300 }}>
                          <div style={{ marginBottom: 24 }}>
                            <Title level={5}>📝 简历摘要</Title>
                            <Paragraph style={{ 
                              background: '#f9f9f9', 
                              padding: 16,
                              borderRadius: 8
                            }}>
                              {result.summary}
                            </Paragraph>
                          </div>
                          
                          <div style={{ marginBottom: 24 }}>
                            <Title level={5}>📌 关键技能</Title>
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap',
                              gap: 8
                            }}>
                {result.keywords.length > 0 ? (
                  result.keywords.map((keyword, index) => (
                                  <Tag 
                                    color="blue" 
                                    key={index}
                                    style={{ 
                                      margin: 0,
                                      padding: '4px 8px',
                                      fontSize: 14
                                    }}
                                  >
                      {keyword}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">暂无提取到关键技能</Text>
                )}
                            </div>
                          </div>

                          <div>
                            <Title level={5}>📈 优化建议</Title>
                  <List
                    size="small"
                    dataSource={result.suggestions}
                              renderItem={(item, index) => (
                                <List.Item style={{ padding: '8px 0' }}>
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'flex-start'
                                  }}>
                                    <CheckCircleOutlined style={{ 
                                      color: '#52c41a',
                                      marginRight: 8,
                                      marginTop: 4
                                    }} />
                                    <div>{`${index + 1}. ${item}`}</div>
                                  </div>
                                </List.Item>
                              )}
                              locale={{ emptyText: '暂无优化建议' }}
                            />
                          </div>
                          
                          <Divider />
                          
                          <div style={{ textAlign: 'center' }}>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={handleDownloadReport}
                              style={{ 
                                borderRadius: 8,
                                padding: '0 24px'
                              }}
                            >
                              下载分析报告
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          </div>
        
        {/* 关于我们 */}
        <div
          ref={aboutRef}
          style={{
            padding: isMobile ? '40px 16px' : '80px 50px',
            background: '#fff',
          }}
        >
          <Row justify="center">
            <Col xs={24} sm={20} md={18} lg={16} xl={14}>
              <Title 
                level={2} 
                style={{ 
                  marginBottom: 32,
                  textAlign: 'center'
                }}
              >
                关于我们
              </Title>
              
              <Card style={{ borderRadius: 8 }}>
                <Title level={4}>我们是谁？</Title>
                <Paragraph>
                  ResumeMaster AI 项目致力于帮助求职者优化简历，通过人工智能技术为用户提供个性化的简历分析和优化建议，让求职者在竞争激烈的就业市场中脱颖而出。
                </Paragraph>
                
                <Divider />
                
                <Space direction="vertical" size={16}>
                  <div>
                    <Text strong>项目背景：</Text>
                    <Paragraph>
                      我们注意到许多求职者在编写简历时面临困难，无法准确突出自己的优势和技能。ResumeMaster AI 应运而生，旨在利用AI技术助力求职者创建更具竞争力的简历。
                    </Paragraph>
                </div>
                  
                  <div>
                    <Text strong>使用模型：</Text>
                    <Paragraph>
                      我们的分析系统基于DeepSeek AI大语言模型，能够深入理解简历内容，提取关键信息，并给出针对性的优化建议。
                    </Paragraph>
          </div>
                  
                  <div>
                    <Text strong>开发者信息：</Text>
                    <Paragraph>
                      Jack Liu | 联系邮箱：contact@resumemaster.ai
                    </Paragraph>
                </div>
                </Space>
              </Card>
            </Col>
          </Row>
          </div>
      </Content>
      
      {/* 页脚 */}
      <Footer style={{ 
        textAlign: 'center',
        background: '#001529',
        color: 'rgba(255, 255, 255, 0.65)',
        padding: '24px 50px'
      }}>
        <div>© 2025 ResumeMaster AI. All rights reserved.</div>
        <div style={{ marginTop: 8 }}>
          联系邮箱：contact@resumemaster.ai | Powered by Jack Liu
    </div>
      </Footer>
    </Layout>
  );
};

export default App;
