import React, { FC, ReactNode } from "react";
import { Icon } from "@iconify/react";
import IconBox from "@/components/elements/base/iconbox/IconBox";
import Heading from "@/components/elements/base/heading/Heading";
import Tag from "@/components/elements/base/tag/Tag";
import { format } from "date-fns";
import { useTranslation } from "next-i18next";

type BinaryOrder = {
  id: string;
  symbol: string;
  side: string;
  status: string;
  amount: number;
  profit: number;
  createdAt: string;
};

type Props = {
  shape?: "straight" | "rounded-sm" | "curved" | "full";
  positions: BinaryOrder[];
};

const getStatusColor = (
  status: string
): "success" | "warning" | "danger" | "info" => {
  switch (status) {
    case "WIN":
      return "success";
    case "PENDING":
      return "warning";
    case "LOSS":
    case "CANCELLED":
    case "REJECTED":
      return "danger";
    case "DRAW":
      return "info";
    default:
      return "info";
  }
};

const getProfitContent = (item: BinaryOrder): ReactNode => {
  const [, pair] = item.symbol.split("/") || [];
  const basePair = pair || "";

  if (item.status === "PENDING") {
    return <span className="text-warning-500">Pending</span>;
  }

  let profitValue = 0;
  let classColor = "text-muted";

  if (item.status === "WIN") {
    profitValue = item.amount * (item.profit / 100);
    classColor = "text-success-500";
  } else if (item.status === "LOSS") {
    profitValue = -item.amount;
    classColor = "text-danger-500";
  } else if (item.status === "DRAW") {
    profitValue = 0;
    classColor = "text-muted";
  }

  return (
    <span className={classColor}>
      {profitValue > 0 ? `+${profitValue}` : profitValue} {basePair}
    </span>
  );
};

const BinaryList: FC<Props> = ({ shape = "rounded-sm", positions }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full overflow-y-auto xs:h-64 sm:h-80 slimscroll">
      <div className="space-y-6 pr-2">
        {positions.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <IconBox
              variant="pastel"
              size="md"
              shape={"rounded-sm"}
              color={item.side === "RISE" ? "success" : "danger"}
              icon={`ph:trend-${item.side === "RISE" ? "up" : "down"}-duotone`}
            />
            <div>
              <Heading
                as="h3"
                weight="medium"
                className="text-muted-800 dark:text-muted-100 text-md"
              >
                {item.symbol}
              </Heading>
              <span className="text-muted-400 text-sm">
                {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <div className="ms-auto">
              <Tag color={getStatusColor(item.status)} variant="pastel">
                {getProfitContent(item)}
              </Tag>
            </div>
          </div>
        ))}
        {positions.length === 0 && (
          <div className="flex w-full justify-center items-center flex-col text-gray-500 dark:text-gray-500 xs:h-64 sm:h-80">
            <Icon icon="ph:files-thin" className="h-16 w-16" />
            {t("No Positions Found")}
          </div>
        )}
      </div>
    </div>
  );
};

export default BinaryList;
