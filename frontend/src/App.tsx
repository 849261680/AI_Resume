import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Button,
  Card,
  Empty,
  Spin,
  Typography,
  Tag,
  List
} from 'antd';
import { UploadOutlined, FileDoneOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface AnalysisResult {
  summary: string; // 简历摘要
  keywords: string[]; // 关键词列表
  suggestions: string[]; // 优化建议列表
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null); // ⬅️ 上传状态
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setUploadStatus(null); // 上传前清除状态
    
    // 设置超时计时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        alert('后端处理时间过长，请稍后重试。');
        setLoading(false);
        setUploadStatus('error');
      }
    }, 30000); // 30秒超时提示
    
    const formData = new FormData();
    formData.append('file', file);
    try {
      console.log('Uploading file:', file);
      const response = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 设置超时时间为30秒
      });
      setResult(response.data);
      setUploadStatus('success');
      console.log('Response data:', response.data);
    } catch (err) {
      setUploadStatus('error');
      if (err.code === 'ECONNABORTED') {
        console.error('请求超时，请稍后重试');
        alert('请求超时，请稍后重试');
        console.error('Error:', err);
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

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f5f9ff, #ffffff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 700,
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3}>
            <FileDoneOutlined style={{ marginRight: 10 }} />
            AI 简历优化助手
          </Title>
          <Text type="secondary">智能分析你的简历内容，快速获得优化建议</Text>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Upload
            beforeUpload={(file) => {
              handleUpload(file);
              return false;
            }}
            showUploadList={false}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              size="large"
              style={{ borderRadius: 8, padding: '0 24px' }}
            >
              上传你的简历文件（PDF / DOCX）
            </Button>
          </Upload>

          {/* 上传结果提示 ✅❌ */}
          {uploadStatus === 'success' && (
            <Text type="success" style={{ display: 'block', marginTop: 12 }}>
              ✅ 上传成功
            </Text>
          )}
          {uploadStatus === 'error' && (
            <Text type="danger" style={{ display: 'block', marginTop: 12 }}>
              ❌ 上传失败，请重试
            </Text>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Spin tip="正在分析简历..." size="large" />
          </div>
        )}

        {/* 分析结果展示区域 */}
        {!loading && result && (
          <div style={{ marginTop: 32 }}>
            <Card title="简历分析结果" bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
              {/* 简历摘要 */}
              <Card type="inner" title="📝 简历摘要" style={{ marginBottom: 16 }}>
                <Text>{result.summary}</Text>
              </Card>

              {/* 关键技能 */}
              <Card type="inner" title="📌 关键技能" style={{ marginBottom: 16 }}>
                {result.keywords.length > 0 ? (
                  result.keywords.map((keyword, index) => (
                    <Tag color="blue" key={index} style={{ margin: '4px' }}>
                      {keyword}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">暂无提取到关键技能</Text>
                )}
              </Card>

              {/* 优化建议 */}
              <Card type="inner" title="📈 优化建议">
                {result.suggestions.length > 0 ? (
                  <List
                    size="small"
                    dataSource={result.suggestions}
                    renderItem={(item, index) => <List.Item>{`${index + 1}. ${item}`}</List.Item>}
                  />
                ) : (
                  <Text type="secondary">暂无优化建议</Text>
                )}
              </Card>
            </Card>
          </div>
        )}


        {!loading && !result && uploadStatus !== 'error' && ( // 初始状态或上传成功但无结果（理论上不应发生）
          <div style={{ marginTop: 32 }}>
            <Empty
              description={
                <div style={{ textAlign: 'center' }}>
                  上传简历文件，我们将为你进行智能分析
                </div>
              }
              imageStyle={{ height: 100 }}
            />
          </div>
        )}

         {/* 保留错误状态下的 Empty 提示 */}
         {!loading && !result && uploadStatus === 'error' && (
          <div style={{ marginTop: 32 }}>
            <Empty
              description={
                <div style={{ textAlign: 'center' }}>
                  上传失败，请检查文件或稍后重试
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default App;
