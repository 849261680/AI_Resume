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
  Tooltip,
  Tabs,
  Image,
  Carousel,
  Avatar
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  RocketOutlined,
  ExperimentOutlined,
  RobotOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  MailOutlined,
  GithubOutlined,
  ArrowDownOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios, { AxiosError } from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;
const { Panel } = Collapse;
const { TextArea } = Input;
const { TabPane } = Tabs;

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

// 定义常见问题数据
const faqData = [
  {
    question: '支持哪些文件格式？',
    answer: '目前支持PDF、DOCX和TXT格式的简历文件上传和分析。'
  },
  {
    question: 'AI分析的准确度如何？',
    answer: '我们使用DeepSeek AI大语言模型进行分析，能够理解大多数行业的专业术语和技能要求，准确度较高。但仍建议结合个人情况判断优化建议。'
  },
  {
    question: '我的简历数据安全吗？',
    answer: '您的简历仅用于当前分析，我们不会永久存储您的简历内容，分析完成后数据将自动清除。'
  },
  {
    question: '使用次数有限制吗？',
    answer: '目前测试阶段对每位用户没有使用次数限制，未来可能会根据服务器负载情况调整。'
  }
];

// 定义用户评价数据
const testimonials = [
  {
    name: '张先生',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    position: '软件工程师',
    comment: '通过AI助手优化后，简历获得了更多面试邀请，真的很实用！'
  },
  {
    name: '李女士',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    position: '市场营销专员',
    comment: '分析结果很专业，给出的建议针对性强，帮我找到了简历的弱点。'
  },
  {
    name: '王先生',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    position: '产品经理',
    comment: '简单易用，结果一目了然，为我的求职带来了很大帮助。'
  }
];

const App: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [targetPosition, setTargetPosition] = useState<string>('');
  const [showResumeText, setShowResumeText] = useState<boolean>(false);
  const [activeTabKey, setActiveTabKey] = useState<string>('upload');
  const [currentFaqVisible, setCurrentFaqVisible] = useState<number | null>(null);
  const [testimonialIndex, setTestimonialIndex] = useState<number>(0);
  
  // 引用
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  // 响应式设计变量
  const { width } = useWindowSize();
  const isMobile = width < 576;
  const isTablet = width >= 576 && width < 992;
  
  // 色彩变量
  const colors = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    text: 'var(--color-text)',
    textLight: 'var(--color-text-light)',
    background: 'var(--color-background)',
    border: 'var(--color-border)',
    cardBg: '#ffffff',
    gradientPrimary: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
    footerBg: '#1E293B'
  };

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
    
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
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
      case 'testimonials':
        targetRef = testimonialsRef;
        break;
      case 'faq':
        targetRef = faqRef;
        break;
      case 'about':
        targetRef = aboutRef;
        break;
      default:
        targetRef = heroRef;
    }
    
    if (targetRef && targetRef.current) {
      try {
        // 使用requestAnimationFrame确保滚动平滑
        requestAnimationFrame(() => {
          if (targetRef && targetRef.current) {
            targetRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      } catch (err) {
        // 降级方案
        if (targetRef && targetRef.current) {
          const offsetTop = targetRef.current.offsetTop - 64;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
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

  // 修改功能卡片渲染函数
  const renderFeatureCard = (
    icon: React.ReactNode,
    title: string,
    description: string
  ) => (
    <Col xs={24} sm={12} md={6} style={{ marginBottom: isMobile ? 24 : 0 }}>
      <Card
        style={{ 
          height: '100%',
          minHeight: 240,
          textAlign: 'center',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          border: 'none',
          transition: 'all 0.3s ease'
        }}
        className="feature-card"
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ 
          fontSize: 32, 
          color: 'var(--color-primary)', 
          marginBottom: 20,
          background: 'rgba(53, 99, 233, 0.1)',
          width: 72,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          margin: '0 auto 24px auto'
        }}>
          {icon}
        </div>
        <Title level={isMobile ? 5 : 4} style={{ marginBottom: 16, fontSize: isMobile ? 18 : 20 }}>
          {title}
        </Title>
        <Text style={{ color: 'var(--color-text-light)', fontSize: 14 }}>{description}</Text>
      </Card>
    </Col>
  );

  return (
    <Layout style={{ 
      height: '100vh', 
      overflowY: 'auto', 
      overflowX: 'hidden',
      willChange: 'transform',
      transform: 'translateZ(0)',
      WebkitBackfaceVisibility: 'hidden',
      backfaceVisibility: 'hidden',
      background: 'var(--color-background)'
    }}>
      {/* 导航栏 */}
      <Header style={{ 
        position: 'fixed', 
        top: 0, 
        zIndex: 999, 
        width: '100%',
        height: 64,
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        padding: isMobile ? '0 16px' : '0 50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ 
          fontSize: isMobile ? 18 : 22, 
          fontWeight: 'bold',
          color: 'var(--color-primary)',
          letterSpacing: '0.5px'
        }}>
          ResumeMaster AI
        </div>
        
        {/* 删除右上角立即上传简历按钮 */}
        {/* <Button 
          type="primary" 
          size={isMobile ? 'middle' : 'large'}
          onClick={() => scrollToSection('upload')}
          style={{ 
            borderRadius: 6, 
            fontWeight: 'bold',
            display: isMobile ? 'none' : 'block',
            background: 'var(--color-primary)',
            border: 'none'
          }}
          className="hover-effect"
        >
          立即上传简历
        </Button> */}
        
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
      
      <Content style={{ paddingTop: 64 }}>
        {/* Hero区域 */}
        <div 
          ref={heroRef}
          style={{
            textAlign: 'center',
            padding: isMobile ? '40px 16px' : '80px 50px',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            minHeight: isMobile ? '80vh' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            color: '#ffffff'
          }}
        >
          <div className="wave-background"></div>
          <Title 
            level={isMobile ? 2 : 1} 
            style={{ 
              marginBottom: 16,
              fontSize: isMobile ? 32 : (isTablet ? 40 : 48),
              color: '#ffffff',
              fontWeight: 700
            }}
          >
            一键AI优化简历
          </Title>
          
          <Title 
            level={isMobile ? 4 : 3} 
            style={{
              marginBottom: 32,
              fontWeight: 'normal',
              fontSize: isMobile ? 18 : (isTablet ? 22 : 24),
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            智能解析，精准优化
          </Title>
          
          {/* 包裹按钮和提示文本，便于居中 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 新上传按钮，点击后弹出文件选择并自动分析 */}
            <input
              id="resume-upload-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  setFile(files[0]);
                  setUploadStatus(null);
                  setResult(null);
                  setLoading(true);
                  // 读取文件内容预览
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target && typeof ev.target.result === 'string') {
                      setResumeText(ev.target.result.substring(0, 500) + '...');
                      setShowResumeText(true);
                    }
                  };
                  reader.readAsText(files[0]);
                  // 自动分析
                  const formData = new FormData();
                  formData.append('file', files[0]);
                  if (targetPosition) {
                    formData.append('position', targetPosition);
                  }
                  try {
                    const apiUrl = import.meta.env.VITE_API_URL;
                    if (!apiUrl) {
                      message.error("API 地址未配置，请联系管理员。");
                      setLoading(false);
                      setUploadStatus('error');
                      return;
                    }
                    const response = await axios.post(`${apiUrl}/api/analyze`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      timeout: 30000
                    });
                    setResult(response.data);
                    setUploadStatus('success');
                    message.success('简历分析完成！');
                  } catch (err) {
                    setUploadStatus('error');
                    message.error('简历分析失败，请重试');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
            />
            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined style={{ marginRight: '4px' }} />}
              onClick={() => document.getElementById('resume-upload-input')?.click()}
              style={{ 
                height: isMobile ? 48 : 56,
                fontSize: isMobile ? 16 : 18,
                padding: '0 24px',   // 增加左右内边距以容纳一个字宽
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'auto',      
                // maxWidth: isMobile ? '110px' : '130px', // 移除maxWidth，让padding决定宽度
                borderRadius: 8,
                marginBottom: 16, 
                background: '#ffffff',
                color: 'var(--color-primary)',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }}
              className="hero-button"
              loading={loading}
            >
              上传简历
            </Button>
            <div>
              <Text type="secondary">
                支持PDF / DOCX / TXT格式
              </Text>
            </div>
          </div>
          {/* 结果展示区，宽度统一，初始高度增加 */}
          <div style={{
            margin: '40px auto 0 auto',
            maxWidth: isMobile ? '90%' : '900px',
            width: '100%', 
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(53,99,233,0.08)',
            padding: isMobile ? 20 : 48,
            color: '#222',
            textAlign: 'left',
            position: 'relative',
            zIndex: 2,
            minHeight: loading || result ? 220 : 330, // 初始状态(Empty)高度增加到330px
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center' 
          }}>
            <div style={{ width: '100%' }}> {/* 内部div确保内容从左开始 */} 
              {loading ? (
                <div style={{ textAlign: 'center', width: '100%' }}> {/* 确保Spin也居中 */} 
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">正在使用AI深度分析你的简历...</Text>
                  </div>
                </div>
              ) : result ? (
                <div style={{ textAlign: 'left', width: '100%' }}> {/* 确保分析结果靠左 */} 
                  <Title level={3} style={{ color: 'var(--color-primary)', marginBottom: 24 }}>AI分析结果</Title>
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>📝 简历摘要</Title>
                    <Paragraph style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                      {result.summary}
                    </Paragraph>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5}>📌 关键技能</Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {result.keywords.length > 0 ? (
                        result.keywords.map((keyword, index) => (
                          <Tag color="blue" key={index} style={{ margin: 0, padding: '4px 8px', fontSize: 14 }}>
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
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8, marginTop: 4 }} />
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
                      style={{ borderRadius: 8, padding: '0 24px' }}
                    >
                      下载分析报告
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', width: '100%' }}> {/* 确保Empty也居中 */} 
                  <FileTextOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ fontSize: 18, marginTop: 8, color: '#888' }}>请上传您的简历，AI将为您生成分析结果</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Content>
      
      {/* 页脚 */}
      <Footer style={{ 
        textAlign: 'center',
        background: '#1E293B',
        color: 'rgba(255, 255, 255, 0.65)',
        padding: '40px 50px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ 
            fontSize: 22, 
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16
          }}>
            ResumeMaster AI
          </div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            通过AI技术助力求职者创建更具竞争力的简历，提升职场竞争力。
          </Text>
          <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '24px 0' }} />
          <div>© 2025 ResumeMaster AI. All rights reserved. | Powered by Jack Liu</div>
        </div>
      </Footer>
    </Layout>
  );
};

export default App;
