import React from "react";
import { ChakraProvider, Flex, Heading, Image } from "@chakra-ui/react";
import FileUpload from "./components/organisms/FileUpload";

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <div className="App">
        <header className="App-header">
          <Flex align="center">
            <Image w="80px" h="80px" src="icon.png" />
            <Heading py="10">NamazNow Timings Import</Heading>
          </Flex>

          <FileUpload />
        </header>
      </div>
    </ChakraProvider>
  );
};

export default App;
