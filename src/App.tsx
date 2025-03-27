import { ThemeProvider } from "@emotion/react";
import {
  ClearRounded,
  DownloadRounded,
  EditRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  createTheme,
  CssBaseline,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { amber, brown } from "@mui/material/colors";
import FileSaver from "file-saver";
import { matchSorter } from "match-sorter";
import { parse, unparse } from "papaparse";
import {
  ChangeEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast, ToastContainer } from "react-toastify";
import { StyledTable } from "./components/StyledTable";
const theme = createTheme({
  palette: {
    primary: brown,
    background: { default: alpha(amber[50], 0.2) },
  },
});

export const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [hasComitted, setHasCommited] = useState(false);
  const [search, setSearch] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<
    Record<string, string | undefined>[]
  >([]);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (fileList === null || fileList.length === 0) {
        setFile(null);
        return;
      }
      const file = fileList.item(0);
      setFile(file);
    },
    []
  );
  const handleFileSave = useCallback(() => {
    if (file === null) {
      return;
    }
    const csvContent = unparse(rows, {
      header: true,
      skipEmptyLines: true,
    });
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8",
    });
    FileSaver.saveAs(
      blob,
      `${file.name.slice(0, -4)} - edited.csv`
    );
    toast.success("Exported successfully!");
  }, [rows, file]);

  const handleFileSubmit = useCallback(() => {
    if (file === null) {
      toast.warn("No selected file");
      return;
    }
    parse(file, {
      skipEmptyLines: true,
      header: true,
      complete: (results) => {
        const existingHeaders = new Set(
          results.meta.fields
        );
        let attendanceHeader = "Arrival date (UTC)";
        while (existingHeaders.has(attendanceHeader)) {
          attendanceHeader += "1";
        }
        let idHeader = "__id";
        while (existingHeaders.has(idHeader)) {
          idHeader += "1";
        }

        setHeaders([
          idHeader,
          attendanceHeader,
          ...results.meta.fields!,
        ]);

        setRows(() => {
          const next: Record<string, string | undefined>[] =
            [];
          for (const [
            index,
            item,
          ] of results.data.entries()) {
            const _item = item as Record<
              string,
              string | undefined
            >;
            _item[attendanceHeader] = undefined;
            _item[idHeader] = index.toString();
            next.push(_item);
          }
          return next;
        });
        toast.success("Opened successfully!");
      },
      error: () => {
        setRows([]);
        setHeaders([]);
        toast.error("Open failed");
      },
    });
    setHasCommited(true);
  }, [file]);

  const handleCheckin = useCallback(
    (index: number, value: boolean) => {
      setRows((prev) => {
        const next = [...prev];
        const now = new Date(Date.now());
        next[index][headers[1]] = value
          ? now.toISOString()
          : undefined;
        return next;
      });
    },
    [headers]
  );

  const searchedRows = useMemo(() => {
    const terms = search
      .split(" ")
      .map((term) => term.trim().normalize())
      .filter((term) => term.length > 0);

    if (terms.length === 0) {
      return rows;
    }

    return terms.reduceRight(
      (results, term) =>
        matchSorter(results, term, { keys: headers }),
      rows
    );
  }, [rows, search, headers]);

  const allEntryCount = useMemo(() => {
    return rows.length;
  }, [rows]);

  const visibleEntryCount = useMemo(() => {
    return searchedRows.length;
  }, [searchedRows]);

  const arrivedEntryCount = useMemo(() => {
    return rows.filter(
      (row) => row[headers[1]] !== undefined
    ).length;
  }, [rows, headers]);

  const missingEntryCount = useMemo(() => {
    return allEntryCount - arrivedEntryCount;
  }, [allEntryCount, arrivedEntryCount]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        closeOnClick
        closeButton={false}
        pauseOnFocusLoss={false}
      />
      <Box
        sx={{
          display: hasComitted ? "none" : undefined,
          visibility: hasComitted ? "hidden" : undefined,
        }}
        maxWidth="lg"
        marginX="auto"
        padding={2}
      >
        <Stack spacing={1}>
          <TextField
            onChange={handleFileChange}
            slotProps={{
              htmlInput: {
                accept: ".csv",
                type: "file",
              },
            }}
          />
          <Toolbar
            variant="dense"
            disableGutters
            sx={{ gap: 1 }}
          >
            <Button
              disableElevation
              variant="contained"
              startIcon={<EditRounded />}
              onClick={handleFileSubmit}
            >
              open
            </Button>
          </Toolbar>
        </Stack>
      </Box>
      <Stack
        spacing={2}
        padding={2}
        sx={{
          display: !hasComitted ? "none" : undefined,
          visibility: !hasComitted ? "hidden" : undefined,
        }}
      >
        <TextField
          placeholder="Search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearch("")}>
                    <ClearRounded />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
        <Toolbar
          disableGutters
          variant="dense"
          sx={{ justifyContent: "space-between" }}
        >
          <Stack
            direction="row"
            spacing={2}
            divider={
              <Divider
                flexItem
                variant="fullWidth"
                orientation="vertical"
              />
            }
          >
            <Typography>Total: {allEntryCount}</Typography>
            <Typography>
              Showing: {visibleEntryCount}
            </Typography>
            <Typography>
              Arrived: {arrivedEntryCount}
            </Typography>
            <Typography>
              Missing: {missingEntryCount}
            </Typography>
          </Stack>
          <Button
            disableElevation
            startIcon={<DownloadRounded />}
            variant="contained"
            onClick={handleFileSave}
          >
            export
          </Button>
        </Toolbar>
        <StyledTable
          headers={headers}
          rows={searchedRows}
          onCheckin={handleCheckin}
        />
      </Stack>
    </ThemeProvider>
  );
};
