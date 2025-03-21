import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FC,
  SetStateAction,
  useCallback,
  useMemo,
} from "react";

type Props = {
  headers: string[];
  rows: Record<string, string | undefined>[];
  onCheckin: (
    value: SetStateAction<
      Record<string, string | undefined>[]
    >
  ) => void;
};
export const StyledTable: FC<Props> = (props) => {
  const { headers, rows, onCheckin } = props;

  const dataHeaders = useMemo(() => {
    return headers.slice(2);
  }, [headers]);

  const handleCheckin = useCallback(
    (
      row: Record<string, string | undefined>,
      value: boolean
    ) => {
      onCheckin((prev) => {
        const next = [...prev];
        const now = new Date(Date.now());

        const primaryKey = Number.parseInt(
          row[headers[0]]!
        );

        next[primaryKey][headers[1]] = value
          ? now.toLocaleDateString()
          : undefined;
        return next;
      });
    },
    [headers, onCheckin]
  );

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography
                sx={{
                  wordBreak: "keep-all",
                  textWrap: "nowrap",
                }}
              >
                {headers[1]}
              </Typography>
            </TableCell>
            {dataHeaders.map((header) => (
              <TableCell key={"header" + header}>
                <Typography
                  sx={{
                    wordBreak: "keep-all",
                    textWrap: "nowrap",
                  }}
                >
                  {header}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={"row-data" + index}
              selected
            >
              <TableCell>
                <Tooltip
                  placement="right"
                  title={
                    <Typography>
                      {row[headers[1]] !== undefined
                        ? `Checked in @ ${row[headers[1]]}`
                        : "Not checked in"}
                    </Typography>
                  }
                >
                  <Checkbox
                    checked={row[headers[1]] !== undefined}
                    onChange={(_, value) => {
                      handleCheckin(row, value);
                    }}
                  />
                </Tooltip>
              </TableCell>
              {dataHeaders.map((header, cellIndex) => {
                const entry = row[header] ?? "";
                return (
                  <TableCell
                    key={"row-item" + index + cellIndex}
                  >
                    <Typography>{entry}</Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
