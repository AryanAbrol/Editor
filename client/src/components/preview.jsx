import { useEffect, useState, useRef } from 'react';
import { Box, Button, Select, Textarea, VStack, Flex } from '@chakra-ui/react';

export default function PreviewPane({ html, css, js, autoRun }) {
  const [consoleOutput, setConsoleOutput] = useState('');
  const [screenSize, setScreenSize] = useState('desktop');
  const [consoleVisible, setConsoleVisible] = useState(true);
  const consoleRef = useRef(null); // Reference to the console Textarea

  // Function to listen for messages from the iframe (for console logs and alerts)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'console') {
        setConsoleOutput((prev) => `${prev}\n[Console] ${event.data.message}`);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Function to create iframe content
  const createIframeContent = () => {
    return `
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${html}</body>
        <script>
          (function() {
            const log = console.log;
            console.log = function(...args) {
              log(...args);
              window.parent.postMessage({ type: 'console', message: args.join(' ') }, '*');
            };
            ${js}
          })();
        </script>
      </html>
    `;
  };

  // Scroll the console output to the bottom whenever it's updated
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Function to refresh the iframe content
  const refreshIframe = () => {
    const iframe = document.getElementById('previewFrame');
    if (iframe) {
      iframe.srcdoc = createIframeContent();
    }
  };

  // Set iframe size based on screen size
  const iframeStyle = {
    width: screenSize === 'mobile' ? '375px' : screenSize === 'tablet' ? '768px' : '1024px',
    height: '100%',
    border: 'none',
  };

  // Effect to automatically run code when autoRun changes
  useEffect(() => {
    if (autoRun) {
      refreshIframe();
    }
  }, [autoRun, html, css, js]);

  return (
    <VStack spacing={4} align="stretch" h="100%">
      <Box flex="1" border='1px'>
        <iframe
          id="previewFrame"
          srcDoc={createIframeContent()}
          style={iframeStyle}
          className="border border-gray-300 rounded"
        />
      </Box>
      <Box borderTop="1px" borderColor="gray.200" p={2}>
        <Flex direction="column" mb={2}>
          <Flex mb={2}>
            <Button
              onClick={refreshIframe}
              colorScheme="teal"
              mr={2}
            >
              Run Console
            </Button>
            <Button
              onClick={refreshIframe}
              colorScheme="blue"
              mr={2}
            >
              Refresh
            </Button>
            <Button
              colorScheme="teal"
              mr={2}
              onClick={() => {
                const blob = new Blob([createIframeContent()], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.html';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Code
            </Button>
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
              ref={consoleRef} // Attach the ref to the Textarea for scrolling
              value={consoleOutput}
              isReadOnly
              placeholder="Console output will appear here..."
              height="150px"
              resize="none"
              fontFamily="monospace"
              bg="gray.50"
              overflowY="auto" // Enable scrolling
            />
          )}
        </Flex>
      </Box>
    </VStack>
  );
}