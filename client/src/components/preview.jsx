import { useEffect, useState } from 'react';
import { Box, Button, Select, Textarea, VStack, Flex } from '@chakra-ui/react';

export default function PreviewPane({ html, css, js, autoRun }) {
  const [consoleOutput, setConsoleOutput] = useState('');
  const [screenSize, setScreenSize] = useState('desktop');
  const [consoleVisible, setConsoleVisible] = useState(true); // New state for console visibility

  // Function to capture console logs and alerts from the iframe
  const captureConsoleAndAlerts = (iframe) => {
    const iframeWindow = iframe.contentWindow;
    const originalConsoleLog = iframeWindow.console.log;
    const originalAlert = iframeWindow.alert;

    // Create a custom log function within the iframe
    iframeWindow.console.log = (...args) => {
      setConsoleOutput((prev) => `${prev}\n[Console] ${args.join(' ')}`);
      originalConsoleLog.apply(iframeWindow.console, args);
    };

    // Create a custom alert function within the iframe
    iframeWindow.alert = (message) => {
      setConsoleOutput((prev) => `${prev}\n[Alert] ${message}`);
      originalAlert.call(iframeWindow, message);
    };
  };

  // Function to refresh the iframe
  const refreshIframe = () => {
    const iframe = document.getElementById('previewFrame');
    if (iframe) {
      iframe.contentWindow.location.reload();
    }
  };

  // Function to download the code as an index.html file
  const downloadCode = () => {
    const blob = new Blob([`
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${html}</body>
        <script>
          ${js}
        </script>
      </html>
    `], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewContent = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
      <script>
        window.addEventListener('load', () => {
          window.customConsole = { log: console.log };
          ${js}
        });
      </script>
    </html>
  `;

  // Set iframe size based on screen size
  const iframeStyle = {
    width: screenSize === 'mobile' ? '375px' : screenSize === 'tablet' ? '768px' : '1024px',
    height: '100%',
    border: 'none',
  };

  // Run code on component mount or when autoRun changes
  useEffect(() => {
    if (autoRun) {
      const iframe = document.getElementById('previewFrame');
      if (iframe) {
        captureConsoleAndAlerts(iframe);
      }
    }
  }, [autoRun, js]);

  return (
    <VStack spacing={4} align="stretch" h="100%">
      <Box flex="1" border='1px'>
        <iframe
          id="previewFrame"
          srcDoc={previewContent}
          style={iframeStyle}
          className="border border-gray-300 rounded"
        />
      </Box>
      <Box borderTop="1px" borderColor="gray.200" p={2}>
        <Flex direction="column" mb={2}>
          <Flex mb={2}>
            <Button onClick={() => {
              const iframe = document.getElementById('previewFrame');
              if (iframe) {
                captureConsoleAndAlerts(iframe);
              }
            }} colorScheme="teal" mr={2}>Run Console</Button>
            <Button onClick={refreshIframe} colorScheme="blue" mr={2}>Refresh</Button>
            <Button onClick={downloadCode} colorScheme="teal" mr={2}>Download Code</Button>
            <Button onClick={() => setConsoleVisible(prev => !prev)} colorScheme="purple" ml={2}>
              {consoleVisible ? 'Hide Console' : 'Show Console'}
            </Button>
          </Flex>
          <Select
            value={screenSize}
            onChange={(e) => setScreenSize(e.target.value)}
            mb={2}
          >
            <option value="mobile">Mobile (375px)</option>
            <option value="tablet">Tablet (768px)</option>
            <option value="desktop">Desktop (1024px)</option>
          </Select>
          {consoleVisible && (
            <Textarea
              value={consoleOutput}
              isReadOnly
              placeholder="Console output will appear here..."
              height="150px"
              resize="none"
              fontFamily="monospace"
              bg="gray.50"
            />
          )}
        </Flex>
      </Box>
    </VStack>
  );
}