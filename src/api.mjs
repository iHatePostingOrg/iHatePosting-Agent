import fetch, { FormData } from "node-fetch";
import { DEFAULT_API_URL } from "./constants.mjs";

// The one place that talks to the public API, written to behave as the reference command line does (owner, 2026-11-13): the key goes
// in `Authorization` exactly as it is, every request is made once with no timeout, no retry and no wait, a failure is
// "Request failed: API Error (<status>): <the server's words>", and ids are put into the address as they were typed.

export class IHatePostingAPI {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async createPost(data) {
    return this.request("/public/v1/posts", { method: "POST", body: JSON.stringify(data) });
  }

  async listPosts(filters = {}) {
    const queryString = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) acc[key] = String(value);
        return acc;
      }, {}),
    ).toString();
    return this.request(queryString ? `/public/v1/posts?${queryString}` : "/public/v1/posts", { method: "GET" });
  }

  async deletePost(id) {
    return this.request(`/public/v1/posts/${id}`, { method: "DELETE" });
  }

  async listMedia(page, search) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (search) params.append("search", search);
    const queryString = params.toString();
    return this.request(queryString ? `/public/v1/media?${queryString}` : "/public/v1/media", { method: "GET" });
  }

  async getMediaStatus(id) {
    return this.request(`/public/v1/media/${id}/status`, { method: "GET" });
  }

  /** What a file is called by its extension; anything else is sent as plain bytes. */
  static MIME_TYPES = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", ico: "image/x-icon",
    mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo", mkv: "video/x-matroska", webm: "video/webm", flv: "video/x-flv", wmv: "video/x-ms-wmv", m4v: "video/x-m4v", mpeg: "video/mpeg", mpg: "video/mpeg", "3gp": "video/3gpp",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac", flac: "audio/flac", m4a: "audio/mp4",
    pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  async upload(file, filename, adjust) {
    const formData = new FormData();
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const type = IHatePostingAPI.MIME_TYPES[extension] || "application/octet-stream";

    const blob = new Blob([file], { type });
    if (adjust) formData.append("adjust", "true");
    formData.append("file", blob, filename);

    const url = `${this.apiUrl}/public/v1/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed (${response.status}): ${error}`);
    }

    return await response.json();
  }

  async getMissingContent(postId) {
    return this.request(`/public/v1/posts/${postId}/missing`, { method: "GET" });
  }

  async updateReleaseId(postId, releaseId) {
    return this.request(`/public/v1/posts/${postId}/release-id`, { method: "PUT", body: JSON.stringify({ releaseId }) });
  }

  async changePostStatus(postId, status) {
    return this.request(`/public/v1/posts/${postId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
  }

  async updatePostSettings(postId, settings) {
    return this.request(`/public/v1/posts/${postId}/settings`, { method: "PUT", body: JSON.stringify({ settings }) });
  }

  async getAnalytics(integrationId, date) {
    return this.request(`/public/v1/analytics/${integrationId}?date=${encodeURIComponent(date)}`, { method: "GET" });
  }

  async getPostAnalytics(postId, date) {
    return this.request(`/public/v1/analytics/post/${postId}?date=${encodeURIComponent(date)}`, { method: "GET" });
  }

  async listIntegrations(group) {
    const query = group ? `?group=${encodeURIComponent(group)}` : "";
    return this.request(`/public/v1/integrations${query}`, { method: "GET" });
  }

  async listGroups() {
    return this.request("/public/v1/groups", { method: "GET" });
  }

  async getIntegrationSettings(integrationId) {
    return this.request(`/public/v1/integration-settings/${integrationId}`, { method: "GET" });
  }

  async triggerIntegrationTool(integrationId, methodName, data) {
    return this.request(`/public/v1/integration-trigger/${integrationId}`, { method: "POST", body: JSON.stringify({ methodName, data }) });
  }
}
