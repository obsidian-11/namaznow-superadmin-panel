import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import qs from "qs";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Spinner,
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

interface ILocation {
  id: number;
  name: string;
  timings: [];
}

const FileUpload: React.FC = () => {
  const [jsonData, setJsonData] = useState<PrayerTimes>({});
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number>();
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const [selectedSchoolOfThought, setSelectedSchoolOfThought] =
    useState<string>("");
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const fetchLocations = async () => {
      try {
        const response = await axios.get(`${STRAPI_BASE_URL}/api/locations`, {
          headers: {
            Authorization: `Bearer ${STRAPI_AUTH_TOKEN}`,
          },
        });

        if (isMounted) {
          setLocations(
            response.data.data.map((location: any) => ({
              id: location.id,
              name: location.attributes.name,
            }))
          );
          setLoadingLocations(false);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Error fetching locations.",
            description: "Unable to fetch locations from the server.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setLoadingLocations(false);
        }
      }
    };

    fetchLocations();

    return () => {
      isMounted = false;
    };
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
        zawaal_start: row["ZawaalSTART "] || row["ZawaalSTART"],
        dhuhr: row["Dhuhur/ZawaalEND"],
        asr: row.Asr,
        maghrib: row["Maghrib/GhurubEND/Iftaar"],
        isha: row.Isha,
      };
    });
    return formattedJSON;
  };

  const handleSubmit = async () => {
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

    if (!selectedSchoolOfThought) {
      toast({
        title: "School of Thought not selected.",
        description: "Please select a School of Thought before submitting.",
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

    try {
      const response = await axios.post(
        `${STRAPI_BASE_URL}/api/timing/importTimings`,

        {
          prayerTimings: jsonData,
          locationId: selectedLocation,
          schoolOfThought: selectedSchoolOfThought,
        },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_AUTH_TOKEN}`,
          },
        }
      );

      console.log("res ==", response);

      toast({
        title: "Data submitted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setJsonData({});
      setSelectedLocation(undefined);
      setSelectedSchoolOfThought("");
    } catch (error) {
      toast({
        title: "Error submitting data.",
        description: "An error occurred while submitting the data.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error submitting data:", error);
    }
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
              onChange={(e) => setSelectedLocation(Number(e.target.value))}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="school-of-thought" mt={4}>
            <FormLabel>Select School of Thought</FormLabel>
            <Select
              placeholder="Select School of Thought"
              value={selectedSchoolOfThought}
              onChange={(e) => setSelectedSchoolOfThought(e.target.value)}
            >
              <option value="HANAFI">HANAFI</option>
              <option value="SHAFIEE">SHAFIEE</option>
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
          <Button w="100%" mt={8} colorScheme="blue" onClick={handleSubmit}>
            Submit
          </Button>
        </>
      )}
    </Box>
  );
};

export default FileUpload;
