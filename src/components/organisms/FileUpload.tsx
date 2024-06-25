import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Spinner, // Import Spinner from Chakra UI
} from "@chakra-ui/react";
import { STRAPI_AUTH_TOKEN, STRAPI_BASE_URL } from "../../config/appconfig";

interface PrayerTimes {
  [date: string]: {
    fajr: string;
    sunrise: string;
    zawaal_start: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

const FileUpload: React.FC = () => {
  const [jsonData, setJsonData] = useState<PrayerTimes>({});
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true); // State for loading indicator
  const toast = useToast();

  useEffect(() => {
    // Fetch locations from Strapi
    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${STRAPI_BASE_URL}/api/locations`, {
          headers: {
            Authorization: `Bearer ${STRAPI_AUTH_TOKEN}`,
          },
        });
        console.log("res", response);

        setLocations(
          response.data.data.map((location: any) => location.attributes.name)
        );
        setLoadingLocations(false); // Update state to indicate loading is complete
      } catch (error) {
        toast({
          title: "Error fetching locations.",
          description: "Unable to fetch locations from the server.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoadingLocations(false); // Ensure loading state is turned off in case of error
      }
    };
    fetchLocations();
  }, [toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        const formattedData = formatJson(json);
        setJsonData(formattedData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const formatJson = (data: any[]): PrayerTimes => {
    const formattedJSON: PrayerTimes = {};
    data.forEach((row) => {
      const day = String(row.Date).padStart(2, "0");
      const month = String(row.Month).padStart(2, "0");
      const year = new Date().getFullYear();
      const dateKey = `${day}-${month}-${year}`;
      formattedJSON[dateKey] = {
        fajr: row["Fajr/SehriEND"],
        sunrise: row["Tulu' START"],
        zawaal_start: row["ZawaalSTART"],
        dhuhr: row["Dhuhur/ZawaalEND"],
        asr: row.Asr,
        maghrib: row["Maghrib/GhurubEND/Iftaar"],
        isha: row.Isha,
      };
    });
    return formattedJSON;
  };

  const handleSubmit = () => {
    if (!selectedLocation) {
      toast({
        title: "Location not selected.",
        description: "Please select a location before submitting.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!Object.keys(jsonData).length) {
      toast({
        title: "No file uploaded.",
        description: "Please upload a file before submitting.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Handle form submission logic here
    console.log("Submitting data:", {
      location: selectedLocation,
      data: jsonData,
    });
    // Reset form
    setJsonData({});
    setSelectedLocation("");
    toast({
      title: "Data submitted successfully.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {loadingLocations ? (
        <Spinner size="md" color="teal" />
      ) : (
        <>
          <FormControl id="location">
            <FormLabel>Select Location</FormLabel>
            <Select
              placeholder="Select location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="file-upload" mt={4}>
            <FormLabel>Upload File</FormLabel>
            <Input
              pt="1"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
          </FormControl>
          <Button mt={4} colorScheme="teal" onClick={handleSubmit}>
            Submit
          </Button>
        </>
      )}
      {/* <pre style={{ fontSize: 12, marginTop: 16 }}>
        {JSON.stringify(jsonData, null, 2)}
      </pre> */}
    </Box>
  );
};

export default FileUpload;
