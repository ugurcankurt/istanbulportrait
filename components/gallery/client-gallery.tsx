"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X, Loader2, Image as ImageIcon, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnail: string;
  url: string;
  downloadUrl?: string;
  metadata?: any;
}

export default function ClientGallery({ bookingId }: { bookingId: string }) {
  const t = useTranslations("account.gallery");
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<DriveFile[]>([]);
  const [finalFiles, setFinalFiles] = useState<DriveFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>("raw");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<DriveFile | null>(null);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbnailRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (thumbnailRef.current) {
      thumbnailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedImage]);

  useEffect(() => {
    setIsHighResLoaded(false);
  }, [selectedImage]);

  const activeFiles = activeTab === "raw" ? files : activeTab === "selected" ? selectedGalleryFiles : finalFiles;

  // Preload adjacent images for instant swiping
  useEffect(() => {
    if (isLightboxOpen && selectedImage && activeFiles.length > 0) {
      const currentIndex = activeFiles.findIndex(f => f.id === selectedImage.id);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % activeFiles.length;
        const prevIndex = (currentIndex - 1 + activeFiles.length) % activeFiles.length;

        const imgNext = new Image();
        imgNext.src = activeFiles[nextIndex].url;

        const imgPrev = new Image();
        imgPrev.src = activeFiles[prevIndex].url;
      }
    }
  }, [isLightboxOpen, selectedImage, activeFiles]);

  const navigateImage = (direction: 'next' | 'prev', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedImage || activeFiles.length === 0) return;
    const currentIndex = activeFiles.findIndex(f => f.id === selectedImage.id);
    if (currentIndex === -1) return;

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % activeFiles.length;
      setSelectedImage(activeFiles[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + activeFiles.length) % activeFiles.length;
      setSelectedImage(activeFiles[prevIndex]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !selectedImage) return;
      if (e.key === "ArrowRight") navigateImage('next');
      if (e.key === "ArrowLeft") navigateImage('prev');
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, activeFiles, isLightboxOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) navigateImage('next');
    if (isRightSwipe) navigateImage('prev');
  };

  const [maxSelections, setMaxSelections] = useState(15);
  const [selectionStatus, setSelectionStatus] = useState<"pending" | "completed">("pending");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileZipModal, setShowMobileZipModal] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/account/gallery/${bookingId}`);
        if (!res.ok) throw new Error("Failed to load gallery");

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setFiles(data.files || []);
        setSelectedGalleryFiles(data.selectedFiles || []);
        setFinalFiles(data.finalFiles || []);

        if (data.finalFiles && data.finalFiles.length > 0) {
          setActiveTab("final");
          if (data.finalFiles.length > 0) setSelectedImage(data.finalFiles[0]);
        } else if (data.selectionStatus === "completed" || (data.selectedFiles && data.selectedFiles.length > 0)) {
          setActiveTab("selected");
          if (data.selectedFiles.length > 0) setSelectedImage(data.selectedFiles[0]);
        } else {
          setActiveTab("raw");
          if (data.files && data.files.length > 0) setSelectedImage(data.files[0]);
        }

        if (data.maxSelections) setMaxSelections(data.maxSelections);
        if (data.selectionStatus) setSelectionStatus(data.selectionStatus);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [bookingId]);

  const toggleSelection = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionStatus === "completed") return;

    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      }
      if (prev.length >= maxSelections) {
        alert(`${t("selectUpTo")} ${maxSelections} ${t("photosToBeEdited")}`);
        return prev;
      }
      return [...prev, fileId];
    });
  };

  const submitSelections = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(t("submitConfirm", { count: selectedFiles.length }))) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/account/gallery/${bookingId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFiles })
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Submission failed");

      setSelectionStatus("completed");
      toast.success(t("selectionComplete"));
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(file.downloadUrl || file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const triggerZipDownload = () => {
    setIsZipping(true);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/api/account/gallery/${bookingId}/zip`;
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "files";
    input.value = JSON.stringify(activeFiles.map(f => ({ id: f.id, name: f.name })));

    const inputTab = document.createElement("input");
    inputTab.type = "hidden";
    inputTab.name = "tabName";
    inputTab.value = activeTab;

    form.appendChild(input);
    form.appendChild(inputTab);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    setTimeout(() => {
      setIsZipping(false);
      setShowMobileZipModal(false);
    }, 2000);
  };

  const downloadAll = async () => {
    if (activeFiles.length === 0) return;
    if (isMobile) {
      setShowMobileZipModal(true);
    } else {
      triggerZipDownload();
    }
  };

  // Close lightbox when switching tabs
  useEffect(() => {
    setIsLightboxOpen(false);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t("loading") || "Loading your photos..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
        <p className="font-semibold">{error}</p>
        <Link href="/account/dashboard">
          <Button variant="outline" className="mt-4">{t("backToDashboard")}</Button>
        </Link>
      </div>
    );
  }

  if (files.length === 0 && selectedGalleryFiles.length === 0 && finalFiles.length === 0) {
    return (
      <div className="text-center py-32 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center shadow-inner">
        <div className="bg-primary/5 p-6 rounded-full mb-6">
          <ImageIcon className="h-16 w-16 text-primary/50" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{t("noPhotosYet")}</h3>
        <p className="mt-1 text-muted-foreground">{t("noPhotosDesc")}</p>
      </div>
    );
  }




  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[600px]">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title") || "Your Gallery"}</h1>
          {selectionStatus === "completed" ? (
            <p className="text-muted-foreground mt-1 text-emerald-600 font-medium">
              {t("selectionComplete")}
            </p>
          ) : (
            <p className="text-muted-foreground mt-1">
              {t("selectUpTo")} <strong className="text-primary">{maxSelections}</strong> {t("photosToBeEdited")}
            </p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 shrink-0">
          <TabsList className="bg-muted">
            <TabsTrigger value="raw">{t("rawPhotos")} ({files.length})</TabsTrigger>
            {(selectedGalleryFiles.length > 0 || selectionStatus === "completed") && (
              <TabsTrigger value="selected">{t("selectedPhotos")} ({selectedGalleryFiles.length})</TabsTrigger>
            )}
            {finalFiles.length > 0 && (
              <TabsTrigger value="final" className="bg-primary/10 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t("finalEdited")}
              </TabsTrigger>
            )}
          </TabsList>
          <Button onClick={downloadAll} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            {t("downloadAll")}
          </Button>
        </div>

        {/* Modern Grid Layout */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-background/50 rounded-2xl md:rounded-3xl border border-border/30 p-2 md:p-4 lg:p-6 pb-24">
          {activeFiles.length === 0 ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("noPhotosHere")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 lg:gap-6">
              {activeFiles.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedImage(f);
                    setIsLightboxOpen(true);
                  }}
                  className="group relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer bg-muted transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <img
                    src={f.thumbnail}
                    alt={f.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  {/* Selection Badge for Grid */}
                  {activeTab === "raw" && selectedFiles.includes(f.id) && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-md z-10 scale-in-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 z-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Tabs>

      {/* Full-Screen Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent
          className="max-w-[100vw] sm:max-w-[100vw] w-screen h-[100dvh] m-0 p-0 rounded-none bg-black/95 backdrop-blur-sm border-none flex flex-col overflow-hidden [&>button]:hidden z-50"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") navigateImage('next');
            if (e.key === "ArrowLeft") navigateImage('prev');
          }}
        >
          {selectedImage && (
            <div
              className="flex-1 relative flex flex-col items-center justify-center p-0 overflow-hidden w-full h-full"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEndHandler}
            >
              {/* Custom Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 md:top-6 md:right-6 z-50 text-white/70 hover:text-white hover:bg-white/20 bg-black/40 rounded-full h-10 w-10 md:h-12 md:w-12 backdrop-blur-md"
                onClick={() => setIsLightboxOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/20 bg-black/40 z-20 h-12 w-12 md:h-16 md:w-16 rounded-full hidden sm:flex backdrop-blur-md transition-all"
                onClick={(e) => navigateImage('prev', e)}
              >
                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/20 bg-black/40 z-20 h-12 w-12 md:h-16 md:w-16 rounded-full hidden sm:flex backdrop-blur-md transition-all"
                onClick={(e) => navigateImage('next', e)}
              >
                <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
              </Button>

              {/* Top Action Bar (inside Lightbox) */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-2 md:gap-3">
                {activeTab === "raw" && selectionStatus !== "completed" && (
                  <Button
                    className={`rounded-full shadow-lg transition-all duration-300 gap-2 h-10 md:h-12 px-4 md:px-5 ${selectedFiles.includes(selectedImage.id)
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/30 scale-105'
                      : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-transparent'
                      }`}
                    onClick={(e) => toggleSelection(selectedImage.id, e)}
                  >
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-medium text-sm md:text-base">
                      {selectedFiles.includes(selectedImage.id) ? t("selectedPhotos") : t("select")}
                    </span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/20 backdrop-blur-md border-transparent text-white hover:bg-white/30 hover:text-white rounded-full shadow-lg h-10 w-10 md:h-12 md:w-12"
                  onClick={(e) => handleDownload(selectedImage, e)}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>

              {/* Image Info Overlay (inside Lightbox) */}
              <div className="absolute bottom-28 md:bottom-32 left-4 md:left-6 z-20 bg-black/40 backdrop-blur-md text-white/90 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 flex flex-col pointer-events-none shadow-2xl transition-all">
                <span className="font-bold text-xs md:text-base tracking-wide text-white drop-shadow-md">
                  {selectedImage.name.replace(/\.[^/.]+$/, "")}
                </span>
                {selectedImage.metadata?.time && (
                  <span className="text-[10px] md:text-sm font-medium text-white/70 mt-0.5">
                    {(() => {
                      const timeStr = selectedImage.metadata.time;
                      const [date, time] = timeStr.split(" ");
                      if (!date || !time) return timeStr;
                      const [y, m, d] = date.split(":");
                      const [h, min] = time.split(":");
                      if (y && m && d && h && min) return `${d}.${m}.${y} - ${h}:${min}`;
                      return timeStr;
                    })()}
                  </span>
                )}
              </div>

              {/* Main Image with Progressive Blur-Up */}
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-8 relative">
                {/* Low-Res Placeholder (Instant) */}
                <img
                  src={selectedImage.thumbnail}
                  alt="placeholder"
                  className={`max-h-full max-w-full object-contain drop-shadow-2xl absolute transition-opacity duration-500 ease-in-out ${isHighResLoaded ? 'opacity-0' : 'opacity-100 blur-md scale-105'}`}
                  draggable={false}
                />
                {/* High-Res Image (Fades in when loaded) */}
                <img
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  className={`max-h-full max-w-full object-contain drop-shadow-2xl relative z-10 transition-opacity duration-300 ease-in-out ${isHighResLoaded ? 'opacity-100' : 'opacity-0'}`}
                  draggable={false}
                  decoding="async"
                  onLoad={() => setIsHighResLoaded(true)}
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-28 md:bottom-32 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 text-white/70 bg-black/40 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-sm font-medium tracking-wide backdrop-blur-md z-50 shadow-2xl transition-all">
                {activeFiles.findIndex(f => f.id === selectedImage.id) + 1} / {activeFiles.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sticky Bottom Selection Bar (Only inside Lightbox on raw tab) */}
      {selectionStatus !== "completed" && activeTab === "raw" && files.length > 0 && isLightboxOpen && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:w-full md:max-w-2xl md:mx-auto p-4 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl z-[60] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl hidden sm:block">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/70 font-medium">{t("selectionProgress")}</p>
                <p className="font-bold text-lg leading-none mt-0.5 text-white">
                  <span className={selectedFiles.length === maxSelections ? "text-primary text-xl" : "text-xl"}>{selectedFiles.length}</span>
                  <span className="text-white/50"> / {maxSelections}</span>
                </p>
              </div>
            </div>
            <Button
              onClick={submitSelections}
              disabled={selectedFiles.length === 0 || isSubmitting}
              className={`rounded-xl h-12 px-6 shadow-md transition-all ${selectedFiles.length === maxSelections ? 'animate-pulse shadow-primary/20' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submitPhotos", { count: selectedFiles.length }) || `Submit ${selectedFiles.length} Photos`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
