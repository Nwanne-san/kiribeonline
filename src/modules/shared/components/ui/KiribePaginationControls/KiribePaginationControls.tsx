"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useCallback } from "react";
import { PAGE_LIMIT_OPTIONS } from "@/constants";

export type KiribePaginationControlsProps = {
  currentPage: number;
  rowsPerPage: number;
  totalItems: number;
  rowsPerPageList?: readonly number[];
  onPageChange?: (args: { page: number; rowsPerPage: number }) => void;
  isCondense?: boolean;
};

export function KiribePaginationControls({
  currentPage,
  rowsPerPage,
  totalItems,
  rowsPerPageList = PAGE_LIMIT_OPTIONS,
  onPageChange,
  isCondense = true,
}: KiribePaginationControlsProps) {
  const pageCount = Math.ceil(totalItems / rowsPerPage);

  const handlePageChange = useCallback(
    (_event: React.ChangeEvent<unknown>, page: number) => {
      onPageChange?.({ page, rowsPerPage });
    },
    [onPageChange, rowsPerPage]
  );

  const handleRowsPerPageChange = useCallback(
    (event: { target: { value: unknown } }) => {
      const newRowsPerPage = Number(event.target.value || rowsPerPage);
      onPageChange?.({ page: 1, rowsPerPage: newRowsPerPage });
    },
    [onPageChange, rowsPerPage]
  );

  if (pageCount <= 1 && totalItems <= rowsPerPage) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        py: isCondense ? 1 : 2,
        mt: 4,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          size="small"
          sx={{ minWidth: 72, fontSize: "0.875rem" }}
        >
          {rowsPerPageList.map((val) => (
            <MenuItem key={val} value={val}>
              {val}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Pagination
        page={currentPage}
        count={pageCount}
        onChange={handlePageChange}
        renderItem={(item) => (
          <PaginationItem
            slots={{ previous: ChevronLeftIcon, next: ChevronRightIcon }}
            {...item}
            sx={{
              ...(item.selected && {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
              }),
            }}
          />
        )}
      />
    </Box>
  );
}
