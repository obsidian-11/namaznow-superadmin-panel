import React from "react";
import { ChakraProvider, Heading } from "@chakra-ui/react";
import FileUpload from "./components/organisms/FileUpload";

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <div className="App">
        <header className="App-header">
          <Heading py="10">NamazNow Timings Import</Heading>
          <FileUpload />
        </header>
      </div>
    </ChakraProvider>
  );
};

export default App;
