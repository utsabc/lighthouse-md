import React, { useEffect } from "react";
import { ConfigProvider, Layout } from "antd";
import { Provider } from "react-redux";
import { store } from "./store";
import DocumentPanel from "./components/DocumentPanel";
import ChatPanel from "./components/ChatPanel";
import { useAppDispatch } from "./store/hooks";
import { setInitializing } from "./store/slices/uiSlice";
import { initializeChatManager } from "./store/slices/chatServiceSlice";
import { CompactDisclaimer } from "./components/Disclaimer";
import Header from "./components/Header";

const { Content } = Layout;

const theme = {
  token: {
    colorPrimary: "#ff6b6b",
    colorInfo: "#ff6b6b",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#f5222d",
    colorBgContainer: "#ffffff",
    borderRadius: 8,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  // const { isInitialized, error } = useAppSelector((state) => state.chatService);

  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(initializeChatManager()).unwrap();
      } catch (error) {
        console.error("Failed to initialize chat service:", error);
      } finally {
        dispatch(setInitializing(false));
      }
    };

    init();
  }, [dispatch]);

  return (
    <Layout className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Content className="flex flex-1 p-4 gap-4 overflow-hidden">
        <div className="w-1/3 bg-white rounded-lg shadow-md flex flex-col">
          <DocumentPanel />
        </div>
        <div className="w-2/3 bg-white rounded-lg shadow-md flex flex-col">
          <ChatPanel />
        </div>
      </Content>
      <CompactDisclaimer />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme}>
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
};

export default App;
