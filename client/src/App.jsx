import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Button,
} from "@chakra-ui/react";
import { FaUpload } from "react-icons/fa";
import CodeEditor from "./components/editor";
import PreviewPane from "./components/preview";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function App() {
  const [html, setHtml] = useState("<h1>Hello, World!</h1>");
  const [css, setCss] = useState("h1 { color: red; }");
  const [js, setJs] = useState('console.log("Hello, World!");');
  const [activeTab, setActiveTab] = useState("html");
  const [suggestion, setSuggestion] = useState("");
  const [isSuggestionVisible, setSuggestionVisible] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/html") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        parseHTMLContent(content);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid HTML file.");
    }
  };

  const parseHTMLContent = (content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    const bodyContent = Array.from(doc.body.childNodes)
      .filter(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE &&
          !["STYLE", "SCRIPT"].includes(node.nodeName)
      )
      .map((node) => node.outerHTML)
      .join("");
    setHtml(bodyContent);

    const styleTags = Array.from(doc.querySelectorAll("style"));
    const cssContent = styleTags.map((style) => style.innerHTML).join("\n");
    setCss(cssContent);

    const scriptTags = Array.from(doc.querySelectorAll("script"));
    const jsContent = scriptTags.map((script) => script.innerHTML).join("\n");
    setJs(jsContent);
  };

  const handleTabChange = (index) => {
    const tabs = ["html", "css", "javascript"];
    setActiveTab(tabs[index]);
  };

  const handleContentUpload = () => {
    let content = "";
    if (activeTab === "html") {
      content = html;
    } else if (activeTab === "css") {
      content = css;
    } else if (activeTab === "javascript") {
      content = js;
    }

    console.log(`Sending ${activeTab} content to backend:`, content);
  };

  const handleAISuggestion = async () => {
    let content = "";
    if (activeTab === "html") {
      content = html;
    } else if (activeTab === "css") {
      content = css;
    } else if (activeTab === "javascript") {
      content = js;
    }

    const response = await fetch("http://localhost:5000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, type: activeTab }),
    });

    const { suggestion } = await response.json();

    const htmlPattern = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const cssPattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const jsPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;

    // Extract HTML content (excluding <style> and <script> tags)
    let suggestionHtml = "";
    const bodyMatch = suggestion.match(htmlPattern);
    if (bodyMatch) {
      // Extract the body content without the <style> and <script> tags
      suggestionHtml = bodyMatch[1]
        .replace(cssPattern, "") // Remove CSS from the body content
        .replace(jsPattern, ""); // Remove JavaScript from the body content
    }

    // Extract CSS styles from <style> tags
    const cssMatches = [...suggestion.matchAll(cssPattern)];
    let suggestionCss = cssMatches.map((match) => match[1]).join("\n");

    // Extract JavaScript code from <script> tags
    const jsMatches = [...suggestion.matchAll(jsPattern)];
    let suggestionJS = jsMatches.map((match) => match[1]).join("\n");

    setSuggestion({
      html: suggestionHtml,
      css: suggestionCss,
      js: suggestionJS,
    });
    setSuggestionVisible(true);
  };

  return (
    <Flex
      direction="row"
      h="100vh"
      overflow="hidden"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <PanelGroup autoSaveId="example" direction="horizontal">
        <Panel defaultSizePercentage={25}>
          <Box
            p={4}
            borderRight="1px"
            borderColor="gray.300"
            overflow="auto"
            display="flex"
            flexDirection="column"
          >
            <Heading mb={4} fontSize="2xl" color="teal.600">
              Real-Time Code Editor
            </Heading>
            <Button
              as="label"
              htmlFor="file-input"
              leftIcon={<FaUpload />}
              colorScheme="teal"
              mb={2}
              cursor="pointer"
            >
              Upload HTML file
            </Button>
            <Input
              id="file-input"
              type="file"
              accept=".html"
              onChange={handleFileUpload}
              display="none"
            />
            <Tabs
              variant="solid-rounded"
              height="calc(100% - 80px)"
              onChange={handleTabChange}
            >
              <TabList>
                <Tab
                  fontWeight="bold"
                  _selected={{ color: "white", bg: "teal.500" }}
                >
                  HTML
                </Tab>
                <Tab
                  fontWeight="bold"
                  _selected={{ color: "white", bg: "teal.500" }}
                >
                  CSS
                </Tab>
                <Tab
                  fontWeight="bold"
                  _selected={{ color: "white", bg: "teal.500" }}
                >
                  JavaScript
                </Tab>
              </TabList>
              <TabPanels height="calc(100% - 40px)">
                <TabPanel p={0} height="100%">
                  <CodeEditor
                    language="html"
                    code={html}
                    setCode={setHtml}
                    isSuggestionVisible={isSuggestionVisible}
                    suggestion={suggestion.html}
                  />
                </TabPanel>
                <TabPanel p={0} height="100%">
                  <CodeEditor
                    language="css"
                    code={css}
                    setCode={setCss}
                    isSuggestionVisible={isSuggestionVisible}
                    suggestion={suggestion.css}
                  />
                </TabPanel>
                <TabPanel p={0} height="100%">
                  <CodeEditor
                    language="javascript"
                    code={js}
                    setCode={setJs}
                    isSuggestionVisible={isSuggestionVisible}
                    suggestion={suggestion.js}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Button
              mt={2}
              onClick={handleAISuggestion}
              colorScheme="teal"
              disabled={isSuggestionVisible}
            >
              Get AI Suggestion
            </Button>
          </Box>
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <Box p={4} overflow="auto" height="100%">
            <PreviewPane html={html} css={css} js={js} />
          </Box>
        </Panel>
        <PanelResizeHandle />
      </PanelGroup>
    </Flex>
  );
}
