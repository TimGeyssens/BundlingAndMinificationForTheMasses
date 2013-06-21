<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="FileEditor.aspx.cs" Inherits="BundlingAndMinificationForTheMasses.Umbraco.Pages.FileEditor" MasterPageFile="../../../umbraco/masterpages/umbracoPage.Master"%>
<%@ Register TagPrefix="umb" Namespace="umbraco.uicontrols" Assembly="controls" %>

<asp:content ID="Content1" contentplaceholderid="body" runat="server">

    <umb:UmbracoPanel runat="server" ID="UmbracoPanel" Text="File Editor" hasMenu="true">
                
            <umb:Pane runat="server" ID="EditPane" Text="Edit File">
                        
                    <umb:Feedback runat="server" ID="Feedback" Visible="false" />

                    <umb:PropertyPanel runat="server" ID="NamePanel" Text="Name">
                            <asp:TextBox ID="TxtName" Width="350px" runat="server" />
                    </umb:PropertyPanel>
                        
                    <umb:PropertyPanel runat="server" id="PathPanel" Text="Path">
                            <asp:Literal ID="LtrlPath" runat="server" />
                    </umb:PropertyPanel>

                    <umb:PropertyPanel runat="server" ID="EditorPanel">
                            <umb:CodeArea runat="server" ID="EditorSource" EditorMimeType="text/x-sass" AutoResize="true" OffSetX="47" OffSetY="47"  />
                    </umb:PropertyPanel>

            </umb:Pane>

    </umb:UmbracoPanel>

</asp:content>