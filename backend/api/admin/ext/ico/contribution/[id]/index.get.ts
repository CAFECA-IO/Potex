import {
  getRecord,
  unauthorizedResponse,
  notFoundMetadataResponse,
  serverErrorResponse,
} from "@b/utils/query";
import { baseIcoContributionSchema } from "../utils";
import { models } from "@b/db";

export const metadata = {
  summary:
    "Retrieves detailed information of a specific ICO contribution by ID",
  operationId: "getIcoContributionById",
  tags: ["Admin", "ICO Contributions"],
  parameters: [
    {
      index: 0,
      name: "id",
      in: "path",
      required: true,
      description: "ID of the ICO contribution to retrieve",
      schema: { type: "string" },
    },
  ],
  responses: {
    200: {
      description: "ICO contribution details",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: baseIcoContributionSchema, // Define this schema in your utils if it's not already defined
          },
        },
      },
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("ICO Contribution"),
    500: serverErrorResponse,
  },
  permission: "Access ICO Contribution Management",
  requiresAuth: true,
};

export default async (data) => {
  const { params } = data;

  return await getRecord("icoContribution", params.id, [
    {
      model: models.user,
      as: "user",
      attributes: ["firstName", "lastName", "email", "avatar"],
    },
    {
      model: models.icoPhase,
      as: "phase",
      attributes: ["id", "name"],
      includeModels: [
        {
          model: models.icoToken,
          as: "token",
          attributes: ["name", "currency", "chain", "image"],
        },
      ],
    },
  ]);
};
