#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
ENV ASPNETCORE_URLS "http://*:8080"
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED true
WORKDIR /app
EXPOSE 8080

FROM node:14 AS build-nodejs
WORKDIR /ClientApp
COPY "Kiddo.Web/ClientApp" .
RUN npm install
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
ENV BuildingDocker true
WORKDIR /src
COPY ["Kiddo.Web/Kiddo.Web.csproj", "Kiddo.Web/"]
COPY ["Kiddo.DAL/Kiddo.DAL.csproj", "Kiddo.DAL/"]
COPY ["Kiddo.Database/Kiddo.Database.csproj", "Kiddo.Database/"]
COPY ["Kiddo.Core/Kiddo.Core.csproj", "Kiddo.Core/"]
COPY ["Kiddo.Clients/Kiddo.Clients.csproj", "Kiddo.Clients/"]
RUN dotnet restore "Kiddo.Web/Kiddo.Web.csproj"
COPY . .
WORKDIR "/src/Kiddo.Web"
RUN dotnet build "Kiddo.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Kiddo.Web.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=build-nodejs /ClientApp/build wwwroot
WORKDIR /app
ENTRYPOINT ["dotnet", "Kiddo.Web.dll"]